#!/usr/bin/env node

/**
 * Node.js example for using the Workout CSV Parser
 * This script demonstrates how to parse a workout CSV file and extract insights
 */

const fs = require('fs');
const path = require('path');
const { WorkoutParser, WorkoutAnalyzer } = require('./workout-parser.js');

// Configuration
const CSV_FILE_PATH = process.argv[2] || 'strong8452961796350394804.csv';
const OUTPUT_DIR = './output';

/**
 * Main function to parse and analyze workout data
 */
async function main() {
    try {
        console.log('🏋️  Workout CSV Parser - Node.js Example');
        console.log('=====================================\n');

        // Check if CSV file exists
        if (!fs.existsSync(CSV_FILE_PATH)) {
            console.error(`❌ CSV file not found: ${CSV_FILE_PATH}`);
            console.log('Usage: node example.js <path-to-csv-file>');
            process.exit(1);
        }

        console.log(`📁 Reading CSV file: ${CSV_FILE_PATH}`);
        
        // Read the CSV file
        const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
        console.log(`✅ File loaded (${csvContent.length.toLocaleString()} characters)\n`);

        // Parse the workout data
        console.log('🔄 Parsing workout data...');
        const parser = new WorkoutParser();
        const parsedData = parser.parse(csvContent);
        console.log('✅ Parsing completed!\n');

        // Create analyzer
        const analyzer = new WorkoutAnalyzer(parsedData);

        // Display summary statistics
        displaySummary(parser, parsedData);
        
        // Display detailed analysis
        displayDetailedAnalysis(analyzer);
        
        // Export results
        await exportResults(parsedData, analyzer);
        
        console.log('\n🎉 Analysis completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

/**
 * Display summary statistics
 */
function displaySummary(parser, data) {
    console.log('📊 SUMMARY STATISTICS');
    console.log('====================');
    
    parser.data = data; // Set the data
    const summary = parser.getSummary();
    
    console.log(`Total Workouts: ${summary.totalWorkouts}`);
    console.log(`Total Exercises: ${summary.totalExercises}`);
    console.log(`Total Sets: ${summary.totalSets}`);
    console.log(`Total Volume: ${Math.round(summary.totalVolume).toLocaleString()} kg×reps`);
    console.log(`Average Workout Time: ${summary.avgWorkoutTime} minutes`);
    console.log(`Unique Exercises: ${summary.exerciseTypes.length}`);
    
    if (summary.dateRange) {
        console.log(`Date Range: ${summary.dateRange.start.toDateString()} - ${summary.dateRange.end.toDateString()}`);
        console.log(`Training Span: ${summary.dateRange.span} days`);
    }
    
    if (summary.workoutFrequency) {
        console.log(`Workout Frequency: ${summary.workoutFrequency.workoutsPerWeek} times per week`);
    }
    
    console.log('');
}

/**
 * Display detailed analysis
 */
function displayDetailedAnalysis(analyzer) {
    console.log('📈 DETAILED ANALYSIS');
    console.log('===================');
    
    // Personal Records
    console.log('\n🏆 Personal Records (Top 10):');
    const records = analyzer.getPersonalRecords();
    const topRecords = Object.entries(records)
        .sort((a, b) => b[1].weight - a[1].weight)
        .slice(0, 10);
    
    topRecords.forEach(([exercise, record], index) => {
        console.log(`${index + 1}. ${exercise}: ${record.weight}kg × ${record.reps} reps (${new Date(record.date).toDateString()})`);
    });
    
    // Workout Consistency
    console.log('\n📅 Workout Consistency:');
    const consistency = analyzer.getWorkoutConsistency();
    if (consistency) {
        console.log(`Average gap between workouts: ${consistency.averageGap} days`);
        console.log(`Shortest gap: ${consistency.minGap} days`);
        console.log(`Longest gap: ${consistency.maxGap} days`);
    } else {
        console.log('Not enough data to calculate consistency metrics.');
    }
    
    // Top Exercises by Volume
    console.log('\n💪 Top Exercises by Total Volume:');
    const exerciseVolumes = {};
    analyzer.data.exercises.forEach(exercise => {
        const name = exercise.exercisename;
        if (name && exercise.totalVolume) {
            exerciseVolumes[name] = (exerciseVolumes[name] || 0) + exercise.totalVolume;
        }
    });
    
    const topExercises = Object.entries(exerciseVolumes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    topExercises.forEach(([exercise, volume], index) => {
        console.log(`${index + 1}. ${exercise}: ${Math.round(volume).toLocaleString()} kg×reps`);
    });
}

/**
 * Export results to files
 */
async function exportResults(data, analyzer) {
    console.log('\n💾 EXPORTING RESULTS');
    console.log('===================');
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Export full parsed data as JSON
    const jsonPath = path.join(OUTPUT_DIR, 'workout-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`📄 Full data exported to: ${jsonPath}`);
    
    // Export summary report
    const summaryPath = path.join(OUTPUT_DIR, 'workout-summary.json');
    const parser = new WorkoutParser();
    parser.data = data;
    const summary = parser.getSummary();
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary exported to: ${summaryPath}`);
    
    // Export personal records
    const recordsPath = path.join(OUTPUT_DIR, 'personal-records.json');
    const records = analyzer.getPersonalRecords();
    fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
    console.log(`🏆 Personal records exported to: ${recordsPath}`);
    
    // Export exercise progress data
    const progressPath = path.join(OUTPUT_DIR, 'exercise-progress.json');
    const progressData = {};
    
    // Get progress for top exercises
    const exerciseVolumes = {};
    data.exercises.forEach(exercise => {
        const name = exercise.exercisename;
        if (name && exercise.totalVolume) {
            exerciseVolumes[name] = (exerciseVolumes[name] || 0) + exercise.totalVolume;
        }
    });
    
    const topExercises = Object.entries(exerciseVolumes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
    
    topExercises.forEach(exerciseName => {
        progressData[exerciseName] = analyzer.getExerciseProgress(exerciseName);
    });
    
    fs.writeFileSync(progressPath, JSON.stringify(progressData, null, 2));
    console.log(`📈 Exercise progress exported to: ${progressPath}`);
    
    // Export CSV report
    const csvReportPath = path.join(OUTPUT_DIR, 'workout-report.csv');
    const csvReport = generateCSVReport(data, analyzer);
    fs.writeFileSync(csvReportPath, csvReport);
    console.log(`📋 CSV report exported to: ${csvReportPath}`);
}

/**
 * Generate a CSV report
 */
function generateCSVReport(data, analyzer) {
    const headers = [
        'Exercise Name',
        'Total Sessions',
        'Total Sets',
        'Total Volume',
        'Max Weight',
        'Last Performed',
        'Body Part'
    ];
    
    const exerciseStats = {};
    
    data.exercises.forEach(exercise => {
        const name = exercise.exercisename;
        if (!name) return;
        
        if (!exerciseStats[name]) {
            exerciseStats[name] = {
                sessions: 0,
                sets: 0,
                volume: 0,
                maxWeight: 0,
                lastPerformed: null,
                bodyPart: exercise.bodypart || 'Unknown'
            };
        }
        
        const stats = exerciseStats[name];
        stats.sessions++;
        stats.sets += exercise.sets ? exercise.sets.length : 0;
        stats.volume += exercise.totalVolume || 0;
        
        if (exercise.sets) {
            const maxSetWeight = Math.max(...exercise.sets.map(s => s.weight));
            stats.maxWeight = Math.max(stats.maxWeight, maxSetWeight);
        }
        
        const exerciseDate = new Date(exercise.TIMESTAMP);
        if (!stats.lastPerformed || exerciseDate > stats.lastPerformed) {
            stats.lastPerformed = exerciseDate;
        }
    });
    
    const csvLines = [headers.join(',')];
    
    Object.entries(exerciseStats).forEach(([name, stats]) => {
        const line = [
            `"${name}"`,
            stats.sessions,
            stats.sets,
            Math.round(stats.volume),
            stats.maxWeight,
            stats.lastPerformed ? stats.lastPerformed.toISOString().split('T')[0] : '',
            stats.bodyPart
        ].join(',');
        csvLines.push(line);
    });
    
    return csvLines.join('\n');
}

/**
 * Show usage information
 */
function showUsage() {
    console.log('Usage: node example.js <path-to-csv-file>');
    console.log('');
    console.log('Example:');
    console.log('  node example.js strong8452961796350394804.csv');
    console.log('  node example.js /path/to/your/workout/data.csv');
    console.log('');
    console.log('The script will parse the CSV file and generate analysis reports in the ./output directory.');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
}

// Run the main function
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
