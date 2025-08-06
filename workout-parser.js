/**
 * Comprehensive JavaScript Parser for Workout CSV Data
 * Parses a complex workout CSV file with multiple sections including:
 * - Settings
 * - Routines
 * - Workout Sessions
 * - Exercise Logs
 * - Notes
 */

class WorkoutParser {
    constructor() {
        this.data = {
            settings: {},
            routines: [],
            workoutDays: [],
            exercises: [],
            workoutSessions: [],
            exerciseLogs: [],
            notes: []
        };
        
        this.currentSection = null;
        this.sectionHeaders = new Map();
    }

    /**
     * Parse the entire CSV content
     * @param {string} csvContent - The raw CSV content
     * @returns {Object} Parsed workout data
     */
    parse(csvContent) {
        const lines = csvContent.split('\n');
        let currentSection = null;
        let headers = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line) continue;
            
            // Check for section headers
            if (line.startsWith('### ')) {
                currentSection = this.getSectionFromHeader(line);
                continue;
            }
            
            // Skip separator lines
            if (line.startsWith('######')) {
                continue;
            }
            
            // Parse CSV data based on current section
            if (currentSection) {
                const fields = this.parseCSVLine(line);
                
                // Check if this is a header line (first non-comment line in section)
                if (this.isHeaderLine(fields, currentSection)) {
                    headers = fields;
                    this.sectionHeaders.set(currentSection, headers);
                    continue;
                }
                
                // Parse data line
                if (headers.length > 0 && fields.length > 0) {
                    const rowData = this.createRowObject(headers, fields);
                    this.addToSection(currentSection, rowData);
                }
            }
        }
        
        return this.data;
    }

    /**
     * Determine section type from header line
     * @param {string} headerLine - Section header line
     * @returns {string} Section type
     */
    getSectionFromHeader(headerLine) {
        const header = headerLine.toLowerCase();
        
        if (header.includes('setting')) return 'settings';
        if (header.includes('routine')) return 'routines';
        if (header.includes('workout session')) return 'workoutSessions';
        if (header.includes('notes')) return 'notes';
        
        return 'unknown';
    }

    /**
     * Parse a single CSV line handling quoted fields and commas
     * @param {string} line - CSV line to parse
     * @returns {Array} Array of field values
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(current.trim());
        
        return result;
    }

    /**
     * Check if the current line is a header line
     * @param {Array} fields - Parsed fields
     * @param {string} section - Current section
     * @returns {boolean} True if this is a header line
     */
    isHeaderLine(fields, section) {
        // Check if fields contain typical header names
        const headerIndicators = [
            'row_id', 'USERID', 'TIMESTAMP', '_id', 'name', 
            'exercise_id', 'exercisename', 'setcount', 'logs',
            'total_time', 'workout_time', 'mynote', 'title'
        ];
        
        return fields.some(field => 
            headerIndicators.includes(field) || 
            field.toLowerCase().includes('time') ||
            field.toLowerCase().includes('id')
        );
    }

    /**
     * Create an object from headers and field values
     * @param {Array} headers - Column headers
     * @param {Array} fields - Field values
     * @returns {Object} Row object
     */
    createRowObject(headers, fields) {
        const obj = {};
        
        for (let i = 0; i < headers.length && i < fields.length; i++) {
            const header = headers[i];
            let value = fields[i];
            
            // Convert numeric strings to numbers
            if (this.isNumeric(value)) {
                value = parseFloat(value);
            }
            
            // Parse timestamps
            if (header.toLowerCase().includes('time') && typeof value === 'string' && value.includes('-')) {
                value = new Date(value);
            }
            
            obj[header] = value;
        }
        
        return obj;
    }

    /**
     * Check if a string represents a number
     * @param {string} str - String to check
     * @returns {boolean} True if numeric
     */
    isNumeric(str) {
        if (typeof str === 'number') return true;
        if (typeof str !== 'string') return false;
        return !isNaN(str) && !isNaN(parseFloat(str)) && str.trim() !== '';
    }

    /**
     * Add parsed row to appropriate section
     * @param {string} section - Section name
     * @param {Object} rowData - Parsed row data
     */
    addToSection(section, rowData) {
        switch (section) {
            case 'settings':
                // Settings is typically a single row, so store as object
                this.data.settings = { ...this.data.settings, ...rowData };
                break;
                
            case 'routines':
                // Check if this is a routine definition or a workout day
                if (rowData.difficulty !== undefined || rowData.focus !== undefined) {
                    this.data.routines.push(rowData);
                } else if (rowData.day !== undefined || rowData.dayIndex !== undefined) {
                    this.data.workoutDays.push(rowData);
                } else if (rowData.exercisename !== undefined) {
                    this.data.exercises.push(this.parseExerciseData(rowData));
                }
                break;
                
            case 'workoutSessions':
                this.data.workoutSessions.push(this.parseWorkoutSession(rowData));
                break;
                
            case 'notes':
                this.data.notes.push(rowData);
                break;
                
            default:
                // If we can determine it's exercise log data
                if (rowData.exercisename || rowData.logs) {
                    this.data.exerciseLogs.push(this.parseExerciseLog(rowData));
                }
        }
    }

    /**
     * Parse exercise data with detailed information
     * @param {Object} rowData - Raw exercise data
     * @returns {Object} Parsed exercise data
     */
    parseExerciseData(rowData) {
        const exercise = { ...rowData };
        
        // Parse logs if present (format: "weight×reps,weight×reps,...")
        if (exercise.logs && typeof exercise.logs === 'string') {
            exercise.sets = this.parseSetLogs(exercise.logs);
            exercise.totalSets = exercise.sets.length;
            exercise.totalVolume = exercise.sets.reduce((sum, set) => 
                sum + (set.weight * set.reps), 0);
        }
        
        return exercise;
    }

    /**
     * Parse set logs from string format
     * @param {string} logsString - Logs in format "weight×reps,weight×reps"
     * @returns {Array} Array of set objects
     */
    parseSetLogs(logsString) {
        if (!logsString || logsString === '0') return [];
        
        return logsString.split(',').map((setStr, index) => {
            const [weight, reps] = setStr.trim().split('x').map(v => parseFloat(v) || 0);
            return {
                setNumber: index + 1,
                weight,
                reps,
                volume: weight * reps
            };
        }).filter(set => set.weight > 0 || set.reps > 0);
    }

    /**
     * Parse workout session data
     * @param {Object} rowData - Raw workout session data
     * @returns {Object} Parsed workout session
     */
    parseWorkoutSession(rowData) {
        const session = { ...rowData };
        
        // Calculate derived metrics
        if (session.total_time && session.workout_time) {
            session.efficiency = (session.workout_time / session.total_time * 100).toFixed(1) + '%';
        }
        
        if (session.total_weight && session.total_exercise) {
            session.avgWeightPerExercise = (session.total_weight / session.total_exercise).toFixed(1);
        }
        
        return session;
    }

    /**
     * Parse exercise log entry
     * @param {Object} rowData - Raw exercise log data
     * @returns {Object} Parsed exercise log
     */
    parseExerciseLog(rowData) {
        const log = { ...rowData };
        
        // Parse the logs field if it exists
        if (log.logs && typeof log.logs === 'string') {
            log.sets = this.parseSetLogs(log.logs);
        }
        
        return log;
    }

    /**
     * Get summary statistics from parsed data
     * @returns {Object} Summary statistics
     */
    getSummary() {
        const totalWorkouts = this.data.workoutSessions.length;
        const totalExercises = this.data.exercises.length;
        const totalNotes = this.data.notes.length;
        
        let totalVolume = 0;
        let totalSets = 0;
        
        this.data.exercises.forEach(exercise => {
            if (exercise.sets) {
                totalSets += exercise.sets.length;
                totalVolume += exercise.totalVolume || 0;
            }
        });
        
        const workoutTimes = this.data.workoutSessions
            .map(session => session.total_time)
            .filter(time => time > 0);
        
        const avgWorkoutTime = workoutTimes.length > 0 
            ? Math.round(workoutTimes.reduce((a, b) => a + b, 0) / workoutTimes.length)
            : 0;
        
        const dateRange = this._getDateRange();
        const exerciseTypes = this._getUniqueExercises();
        const workoutFrequency = this._getWorkoutFrequency();
        
        return {
            totalWorkouts,
            totalExercises,
            totalSets,
            totalVolume,
            totalNotes,
            avgWorkoutTime,
            dateRange,
            exerciseTypes,
            workoutFrequency
        };
    }

    /**
     * Get date range of workouts
     * @returns {Object} Date range information
     */
    _getDateRange() {
        const dates = this.data.workoutSessions
            .map(session => new Date(session.starttime * 1000))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a - b);
        
        if (dates.length === 0) return null;
        
        return {
            start: dates[0],
            end: dates[dates.length - 1],
            span: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Get unique exercise names
     * @returns {Array} Array of unique exercise names
     */
    _getUniqueExercises() {
        const exercises = new Set();
        
        this.data.exercises.forEach(exercise => {
            if (exercise.exercisename) {
                exercises.add(exercise.exercisename);
            }
        });
        
        return Array.from(exercises).sort();
    }

    /**
     * Calculate workout frequency
     * @returns {Object} Workout frequency data
     */
    _getWorkoutFrequency() {
        const dateRange = this._getDateRange();
        if (!dateRange || dateRange.span === 0) return null;
        
        const workoutsPerWeek = (this.data.workoutSessions.length / dateRange.span * 7).toFixed(1);
        
        return {
            totalDays: dateRange.span,
            workoutsPerWeek: parseFloat(workoutsPerWeek),
            totalWorkouts: this.data.workoutSessions.length
        };
    }

    /**
     * Export data as JSON
     * @returns {string} JSON string of parsed data
     */
    toJSON() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * Get exercises by muscle group
     * @returns {Object} Exercises grouped by body part
     */
    getExercisesByBodyPart() {
        const bodyParts = {};
        
        this.data.exercises.forEach(exercise => {
            const bodyPart = exercise.bodypart || 'Unknown';
            if (!bodyParts[bodyPart]) {
                bodyParts[bodyPart] = [];
            }
            bodyParts[bodyPart].push(exercise);
        });
        
        return bodyParts;
    }
}

// Usage example and utility functions
class WorkoutAnalyzer {
    constructor(parsedData) {
        this.data = parsedData;
    }

    /**
     * Get progress for a specific exercise
     * @param {string} exerciseName - Name of the exercise
     * @returns {Array} Progress data over time
     */
    getExerciseProgress(exerciseName) {
        return this.data.exercises
            .filter(ex => ex.exercisename === exerciseName)
            .sort((a, b) => new Date(a.TIMESTAMP) - new Date(b.TIMESTAMP))
            .map(ex => ({
                date: ex.TIMESTAMP,
                sets: ex.sets || [],
                maxWeight: ex.sets ? Math.max(...ex.sets.map(s => s.weight)) : 0,
                totalVolume: ex.totalVolume || 0
            }));
    }

    /**
     * Get personal records
     * @returns {Object} Personal records for each exercise
     */
    getPersonalRecords() {
        const records = {};
        
        this.data.exercises.forEach(exercise => {
            const name = exercise.exercisename;
            if (!name || !exercise.sets) return;
            
            exercise.sets.forEach(set => {
                if (!records[name] || set.weight > records[name].weight) {
                    records[name] = {
                        weight: set.weight,
                        reps: set.reps,
                        date: exercise.TIMESTAMP,
                        volume: set.volume
                    };
                }
            });
        });
        
        return records;
    }

    /**
     * Get workout consistency (days between workouts)
     * @returns {Object} Consistency metrics
     */
    getWorkoutConsistency() {
        const workoutDates = this.data.workoutSessions
            .map(session => new Date(session.starttime * 1000))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a - b);
        
        if (workoutDates.length < 2) return null;
        
        const gaps = [];
        for (let i = 1; i < workoutDates.length; i++) {
            const gap = Math.ceil((workoutDates[i] - workoutDates[i-1]) / (1000 * 60 * 60 * 24));
            gaps.push(gap);
        }
        
        return {
            averageGap: Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length),
            minGap: Math.min(...gaps),
            maxGap: Math.max(...gaps),
            totalGaps: gaps.length
        };
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WorkoutParser, WorkoutAnalyzer };
} else if (typeof window !== 'undefined') {
    window.WorkoutParser = WorkoutParser;
    window.WorkoutAnalyzer = WorkoutAnalyzer;
}
