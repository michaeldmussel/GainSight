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

/**
 * Enhanced Workout Parser supporting multiple CSV formats
 * - Format 1: Multi-section format with settings, routines, sessions, notes
 * - Format 2: Strong app format with workout entries in a single table
 */

class MultiFormatWorkoutParser extends WorkoutParser {
    constructor() {
        super();
        this.detectedFormat = null;
    }

    /**
     * Parse CSV content and auto-detect format
     * @param {string} csvContent - The raw CSV content
     * @returns {Object} Parsed workout data
     */
    parse(csvContent) {
        this.detectedFormat = this.detectFormat(csvContent);
        
        if (this.detectedFormat === 'strong') {
            return this.parseStrongFormat(csvContent);
        } else {
            // Use original multi-section parser
            return super.parse(csvContent);
        }
    }

    /**
     * Detect the CSV format based on headers and structure
     * @param {string} csvContent - The raw CSV content
     * @returns {string} Format type: 'strong' or 'multi-section'
     */
    detectFormat(csvContent) {
        const lines = csvContent.split('\n').slice(0, 5); // Check first 5 lines
        
        // Check for Strong format indicators
        const strongIndicators = [
            'Workout #', 'Exercise Name', 'Set Order', 
            'Weight (kg)', 'Reps', 'Duration (sec)'
        ];
        
        const hasStrongHeaders = lines.some(line => 
            strongIndicators.some(indicator => line.includes(indicator))
        );
        
        // Check for multi-section format indicators
        const hasSectionHeaders = lines.some(line => 
            line.includes('### ') || line.includes('######')
        );
        
        return hasStrongHeaders ? 'strong' : 'multi-section';
    }

    /**
     * Parse Strong app CSV format
     * @param {string} csvContent - The raw CSV content
     * @returns {Object} Parsed workout data in standardized format
     */
    parseStrongFormat(csvContent) {
        const lines = csvContent.split('\n');
        let headers = [];
        const rawEntries = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const fields = this.parseCSVLine(line, ';'); // Strong uses semicolon separator
            
            if (i === 0) {
                // First line is headers
                headers = fields.map(field => field.replace(/"/g, ''));
                continue;
            }
            
            if (fields.length >= headers.length) {
                const entry = this.createRowObject(headers, fields);
                rawEntries.push(entry);
            }
        }
        
        return this.transformStrongData(rawEntries);
    }

    /**
     * Parse CSV line with custom separator
     * @param {string} line - CSV line to parse
     * @param {string} separator - Field separator (default: comma)
     * @returns {Array} Array of field values
     */
    parseCSVLine(line, separator = ',') {
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
            } else if (char === separator && !inQuotes) {
                // Field separator
                result.push(current.replace(/^"|"$/g, '').trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        // Add the last field
        result.push(current.replace(/^"|"$/g, '').trim());
        
        return result;
    }

    /**
     * Transform Strong format data into standardized structure
     * @param {Array} rawEntries - Raw CSV entries
     * @returns {Object} Standardized workout data
     */
    transformStrongData(rawEntries) {
        const workouts = new Map();
        const exercises = [];
        const workoutSessions = [];
        
        // Group entries by workout
        rawEntries.forEach(entry => {
            const workoutId = entry['Workout #'];
            const date = entry['Date'];
            const workoutName = entry['Workout Name'];
            const duration = parseInt(entry['Duration (sec)']) || 0;
            
            if (!workouts.has(workoutId)) {
                workouts.set(workoutId, {
                    id: workoutId,
                    date: new Date(date),
                    name: workoutName,
                    duration: duration,
                    exercises: new Map(),
                    totalSets: 0,
                    totalVolume: 0
                });
            }
            
            const workout = workouts.get(workoutId);
            const exerciseName = entry['Exercise Name'];
            
            if (!workout.exercises.has(exerciseName)) {
                workout.exercises.set(exerciseName, {
                    name: exerciseName,
                    sets: []
                });
            }
            
            const exercise = workout.exercises.get(exerciseName);
            
            // Parse set data
            const weight = parseFloat(entry['Weight (kg)']) || 0;
            const reps = parseInt(entry['Reps']) || 0;
            const distance = parseFloat(entry['Distance (meters)']) || 0;
            const seconds = parseFloat(entry['Seconds']) || 0;
            const rpe = entry['RPE'] || '';
            const notes = entry['Notes'] || '';
            
            const setData = {
                setNumber: parseInt(entry['Set Order']),
                weight,
                reps,
                distance,
                seconds,
                rpe,
                notes,
                volume: weight * reps
            };
            
            exercise.sets.push(setData);
            workout.totalSets++;
            workout.totalVolume += setData.volume;
        });
        
        // Convert to standardized format
        workouts.forEach(workout => {
            // Create workout session
            const session = {
                _id: workout.id,
                starttime: Math.floor(workout.date.getTime() / 1000),
                total_time: workout.duration,
                workout_time: workout.duration,
                total_exercise: workout.exercises.size,
                total_weight: workout.totalVolume,
                TIMESTAMP: workout.date.toISOString(),
                workout_name: workout.name
            };
            workoutSessions.push(session);
            
            // Create exercise entries
            workout.exercises.forEach(exercise => {
                const exerciseEntry = {
                    exercisename: exercise.name,
                    sets: exercise.sets.sort((a, b) => a.setNumber - b.setNumber),
                    totalSets: exercise.sets.length,
                    totalVolume: exercise.sets.reduce((sum, set) => sum + set.volume, 0),
                    maxWeight: Math.max(...exercise.sets.map(s => s.weight)),
                    TIMESTAMP: workout.date.toISOString(),
                    workout_id: workout.id,
                    workout_name: workout.name
                };
                exercises.push(exerciseEntry);
            });
        });
        
        return {
            settings: { format: 'strong', parsedAt: new Date().toISOString() },
            routines: [],
            workoutDays: [],
            exercises: exercises,
            workoutSessions: workoutSessions.sort((a, b) => a.starttime - b.starttime),
            exerciseLogs: exercises, // Same as exercises for Strong format
            notes: [],
            format: 'strong',
            totalWorkouts: workoutSessions.length,
            dateRange: this.getStrongDateRange(workoutSessions)
        };
    }

    /**
     * Get date range for Strong format data
     * @param {Array} sessions - Workout sessions
     * @returns {Object} Date range information
     */
    getStrongDateRange(sessions) {
        if (sessions.length === 0) return null;
        
        const dates = sessions.map(s => new Date(s.starttime * 1000)).sort((a, b) => a - b);
        return {
            start: dates[0],
            end: dates[dates.length - 1],
            span: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
        };
    }

    /**
     * Enhanced summary that works with both formats
     * @returns {Object} Summary statistics
     */
    getSummary() {
        if (this.detectedFormat === 'strong') {
            return this.getStrongSummary();
        } else {
            return super.getSummary();
        }
    }

    /**
     * Get summary statistics for Strong format
     * @returns {Object} Summary statistics
     */
    getStrongSummary() {
        const totalWorkouts = this.data.workoutSessions.length;
        const totalExercises = this.data.exercises.length;
        
        let totalVolume = 0;
        let totalSets = 0;
        const exerciseNames = new Set();
        
        this.data.exercises.forEach(exercise => {
            totalSets += exercise.totalSets || 0;
            totalVolume += exercise.totalVolume || 0;
            exerciseNames.add(exercise.exercisename);
        });
        
        const workoutTimes = this.data.workoutSessions
            .map(session => session.total_time)
            .filter(time => time > 0);
        
        const avgWorkoutTime = workoutTimes.length > 0 
            ? Math.round(workoutTimes.reduce((a, b) => a + b, 0) / workoutTimes.length / 60) // Convert to minutes
            : 0;
        
        return {
            totalWorkouts,
            totalExercises,
            totalSets,
            totalVolume,
            avgWorkoutTime,
            exerciseTypes: Array.from(exerciseNames).sort(),
            dateRange: this.data.dateRange,
            workoutFrequency: this.getStrongWorkoutFrequency(),
            format: 'strong'
        };
    }

    /**
     * Calculate workout frequency for Strong format
     * @returns {Object} Workout frequency data
     */
    getStrongWorkoutFrequency() {
        const dateRange = this.data.dateRange;
        if (!dateRange || dateRange.span === 0) return null;
        
        const workoutsPerWeek = (this.data.workoutSessions.length / dateRange.span * 7).toFixed(1);
        
        return {
            totalDays: dateRange.span,
            workoutsPerWeek: parseFloat(workoutsPerWeek),
            totalWorkouts: this.data.workoutSessions.length
        };
    }
}

// Enhanced Analyzer that works with both formats
class EnhancedWorkoutAnalyzer extends WorkoutAnalyzer {
    constructor(parsedData) {
        super(parsedData);
        this.format = parsedData.format || 'multi-section';
    }

    /**
     * Get exercise progress with format-aware processing
     * @param {string} exerciseName - Name of the exercise
     * @returns {Array} Progress data over time
     */
    getExerciseProgress(exerciseName) {
        if (this.format === 'strong') {
            return this.data.exercises
                .filter(ex => ex.exercisename === exerciseName)
                .sort((a, b) => new Date(a.TIMESTAMP) - new Date(b.TIMESTAMP))
                .map(ex => ({
                    date: ex.TIMESTAMP,
                    workoutId: ex.workout_id,
                    workoutName: ex.workout_name,
                    sets: ex.sets || [],
                    maxWeight: ex.maxWeight || 0,
                    totalVolume: ex.totalVolume || 0,
                    totalSets: ex.totalSets || 0
                }));
        } else {
            return super.getExerciseProgress(exerciseName);
        }
    }

    /**
     * Get personal records with format-aware processing
     * @returns {Object} Personal records for each exercise
     */
    getPersonalRecords() {
        const records = {};
        
        this.data.exercises.forEach(exercise => {
            const name = exercise.exercisename;
            if (!name || !exercise.sets) return;
            
            exercise.sets.forEach(set => {
                const weight = set.weight || 0;
                if (weight === 0) return; // Skip bodyweight exercises
                
                if (!records[name] || weight > records[name].weight) {
                    records[name] = {
                        weight: weight,
                        reps: set.reps || 0,
                        date: exercise.TIMESTAMP,
                        volume: set.volume || 0,
                        workoutName: exercise.workout_name || 'Unknown'
                    };
                }
            });
        });
        
        return records;
    }

    /**
     * Get workout consistency with format-aware processing
     * @returns {Object} Consistency metrics
     */
    getWorkoutConsistency() {
        const workoutDates = this.data.workoutSessions
            .map(session => {
                if (this.format === 'strong') {
                    return new Date(session.starttime * 1000);
                } else {
                    return new Date(session.starttime * 1000);
                }
            })
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
            totalGaps: gaps.length,
            format: this.format
        };
    }

    /**
     * Get cardio exercises (distance/time based)
     * @returns {Array} Cardio exercise data
     */
    getCardioExercises() {
        if (this.format !== 'strong') return [];
        
        return this.data.exercises.filter(exercise => 
            exercise.sets.some(set => set.distance > 0 || (set.seconds > 0 && set.weight === 0))
        ).map(exercise => ({
            name: exercise.exercisename,
            sessions: exercise.sets.length,
            totalDistance: exercise.sets.reduce((sum, set) => sum + (set.distance || 0), 0),
            totalTime: exercise.sets.reduce((sum, set) => sum + (set.seconds || 0), 0),
            lastPerformed: exercise.TIMESTAMP
        }));
    }

    /**
     * Get strength exercises (weight based)
     * @returns {Array} Strength exercise data
     */
    getStrengthExercises() {
        return this.data.exercises.filter(exercise => 
            exercise.sets.some(set => (set.weight || 0) > 0)
        );
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        WorkoutParser, 
        WorkoutAnalyzer, 
        MultiFormatWorkoutParser,
        EnhancedWorkoutAnalyzer
    };
} else if (typeof window !== 'undefined') {
    window.WorkoutParser = WorkoutParser;
    window.WorkoutAnalyzer = WorkoutAnalyzer;
    window.MultiFormatWorkoutParser = MultiFormatWorkoutParser;
    window.EnhancedWorkoutAnalyzer = EnhancedWorkoutAnalyzer;
}
