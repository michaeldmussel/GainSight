#!/usr/bin/env node

/**
 * Multi-format test script for both CSV formats
 */

const fs = require('fs');
const path = require('path');
const { MultiFormatWorkoutParser, EnhancedWorkoutAnalyzer } = require('./workout-parser.js');

async function testBothFormats() {
    console.log('🏋️  Multi-Format Workout CSV Parser Test');
    console.log('========================================\n');

    // Test files
    const files = [
        {
            path: 'strong8452961796350394804.csv',
            name: 'Strong App Format',
            expectedFormat: 'strong'
        },
        {
            path: 'c:\\Users\\David\\Downloads\\asafkedem_20250806.csv',
            name: 'Multi-Section Format', 
            expectedFormat: 'multi-section'
        }
    ];

    for (const file of files) {
        console.log(`📁 Testing ${file.name}`);
        console.log(`   File: ${file.path}`);
        
        if (!fs.existsSync(file.path)) {
            console.log(`   ❌ File not found, skipping...\n`);
            continue;
        }

        try {
            // Read and parse the file
            const csvContent = fs.readFileSync(file.path, 'utf-8');
            const parser = new MultiFormatWorkoutParser();
            const parsedData = parser.parse(csvContent);
            
            console.log(`   ✅ Format detected: ${parser.detectedFormat}`);
            console.log(`   📊 Workouts: ${parsedData.workoutSessions.length}`);
            console.log(`   💪 Exercises: ${parsedData.exercises.length}`);
            
            // Create analyzer
            parser.data = parsedData;
            const analyzer = new EnhancedWorkoutAnalyzer(parsedData);
            
            // Get summary
            const summary = parser.getSummary();
            console.log(`   🎯 Total Volume: ${Math.round(summary.totalVolume).toLocaleString()} kg×reps`);
            console.log(`   ⏱️  Avg Workout: ${summary.avgWorkoutTime} minutes`);
            console.log(`   🏃 Unique Exercises: ${summary.exerciseTypes.length}`);
            
            // Get personal records
            const records = analyzer.getPersonalRecords();
            const recordCount = Object.keys(records).length;
            console.log(`   🏆 Personal Records: ${recordCount} exercises`);
            
            if (recordCount > 0) {
                const topRecord = Object.entries(records)
                    .sort((a, b) => b[1].weight - a[1].weight)[0];
                console.log(`   🥇 Top PR: ${topRecord[0]} - ${topRecord[1].weight}kg × ${topRecord[1].reps} reps`);
            }
            
            // Format-specific tests
            if (parser.detectedFormat === 'strong') {
                const cardio = analyzer.getCardioExercises();
                const strength = analyzer.getStrengthExercises();
                console.log(`   🏃 Cardio Exercises: ${cardio.length}`);
                console.log(`   💪 Strength Exercises: ${strength.length}`);
                
                if (cardio.length > 0) {
                    const totalDistance = cardio.reduce((sum, ex) => sum + ex.totalDistance, 0);
                    console.log(`   📏 Total Distance: ${totalDistance.toLocaleString()}m`);
                }
            }
            
            // Workout consistency
            const consistency = analyzer.getWorkoutConsistency();
            if (consistency) {
                console.log(`   📅 Avg Gap: ${consistency.averageGap} days between workouts`);
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Error parsing: ${error.message}\n`);
        }
    }
    
    console.log('🎉 Multi-format testing completed!');
}

// Run the test
testBothFormats().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
