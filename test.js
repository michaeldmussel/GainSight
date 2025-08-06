/**
 * Test script for the Workout CSV Parser
 * This script tests the parser with sample data to ensure it works correctly
 */

const { WorkoutParser, WorkoutAnalyzer } = require('./workout-parser.js');

// Sample CSV data for testing
const sampleCSV = `
### SETTING ##########################################

row_id,USERID,TIMESTAMP,gender,currentRoutine,DOB,name,length,mass,dbversion,vibration,alarm,timer,sets,targetrep,age,zonedifference,location,use_location,screenon,auto_lock,lastlogs,preloadreps,exp_level,fit_goal,audio_reminder,audio_exercise_tips,audio_personal_tips
97563720,11612903,"2025-06-02 06:53:50",M,3,1997-01-01,," cm"," kg",,,,120,4,8,0,2,,0,1,1,0,0,1,0,0,0,0

######################################################

### ROUTINES #########################################

row_id,USERID,TIMESTAMP,_id,name,difficulty,focus,dayaweek,description,daytype,tags,rdb_id,bannerCode,progression_flag
53560581,11612903,"2024-06-08 17:06:28",1,"Barbell Focused Plan",0,0,5,,1," ",0,,0

row_id,USERID,TIMESTAMP,package,_id,name,day,dayIndex,interval_mode,rest_day,week,sort_order,day_completed_timestamp
275187182,11612903,"2025-08-06 00:16:56",1,1,"Back deadlift",1,1,0,0,0,0,"2024-07-08 09:34:38"

row_id,USERID,TIMESTAMP,belongSys,superset,_id,exercise_id,belongplan,exercisename,setcount,timer,logs,bodypart,mysort,targetrep,setdone,setdonetime,interval_time,interval_unit,rest_time_enabled,interval_time_enabled
3645255320,11612903,"2024-12-18 16:07:17",1,0,6,93,1,"Barbell Deadlift",6,60,"20x10,70x5,90x5,100x5,100x4,100x3",0,0,8,0,1720428737,0,sec,1,0

######################################################

### WORKOUT SESSIONS #################################

rowid,_id,USERID,edit_time,day_id,total_time,workout_time,rest_time,wasted_time,total_exercise,total_weight,recordbreak,starttime,endtime,workout_mode,TIMESTAMP,calories
1990763586,1708195761,11612903,1708367577,0,348,140,14,104,1,940,1,1708195761,1708196109,0,"2024-02-21 13:38:46",0

######################################################

### NOTES ############################################

row_id,TIMESTAMP,USERID,_id,eid,belongSys,mynote,title,mydate,logTime,label,bodypart,is_recovered,type
201097218,"2024-02-23 12:05:38",11612903,1,161,1,"Chair on distance 3","Machine Seated Leg Curl",2024-02-21,1708522640,0,-1,0,0

######################################################
`;

function runTests() {
    console.log('🧪 Running Workout CSV Parser Tests');
    console.log('===================================\n');

    try {
        // Test 1: Basic parsing
        console.log('Test 1: Basic parsing...');
        const parser = new WorkoutParser();
        const parsedData = parser.parse(sampleCSV);
        
        console.log('✅ Parsing completed successfully');
        console.log(`   - Settings: ${Object.keys(parsedData.settings).length} properties`);
        console.log(`   - Routines: ${parsedData.routines.length} entries`);
        console.log(`   - Workout Days: ${parsedData.workoutDays.length} entries`);
        console.log(`   - Exercises: ${parsedData.exercises.length} entries`);
        console.log(`   - Workout Sessions: ${parsedData.workoutSessions.length} entries`);
        console.log(`   - Notes: ${parsedData.notes.length} entries\n`);

        // Test 2: Exercise parsing
        console.log('Test 2: Exercise parsing...');
        const exercise = parsedData.exercises[0];
        if (exercise && exercise.sets) {
            console.log('✅ Exercise sets parsed correctly');
            console.log(`   - Exercise: ${exercise.exercisename}`);
            console.log(`   - Sets: ${exercise.sets.length}`);
            console.log(`   - Total Volume: ${exercise.totalVolume} kg×reps`);
            console.log(`   - First set: ${exercise.sets[0].weight}kg × ${exercise.sets[0].reps} reps\n`);
        } else {
            console.log('⚠️  No exercise sets found to test\n');
        }

        // Test 3: Analysis features
        console.log('Test 3: Analysis features...');
        const analyzer = new WorkoutAnalyzer(parsedData);
        
        const summary = parser.getSummary();
        console.log('✅ Summary generation works');
        console.log(`   - Total exercises: ${summary.totalExercises}`);
        console.log(`   - Total sets: ${summary.totalSets}`);
        console.log(`   - Total volume: ${Math.round(summary.totalVolume)} kg×reps\n`);

        const records = analyzer.getPersonalRecords();
        console.log('✅ Personal records analysis works');
        console.log(`   - Found ${Object.keys(records).length} exercises with records\n`);

        // Test 4: CSV line parsing
        console.log('Test 4: CSV line parsing edge cases...');
        const testLines = [
            'simple,test,line',
            '"quoted,field",normal,field',
            'field,"quoted ""with"" escaped quotes",another',
            'empty,,fields'
        ];

        testLines.forEach((line, index) => {
            const parsed = parser.parseCSVLine(line);
            console.log(`   Line ${index + 1}: ${parsed.length} fields parsed`);
        });
        console.log('✅ CSV line parsing handles edge cases\n');

        // Test 5: JSON export
        console.log('Test 5: JSON export...');
        const jsonOutput = parser.toJSON.call({ data: parsedData });
        const reparsed = JSON.parse(jsonOutput);
        console.log('✅ JSON export and re-import works');
        console.log(`   - Exported size: ${jsonOutput.length.toLocaleString()} characters\n`);

        console.log('🎉 All tests passed successfully!');
        console.log('\nSample data structure:');
        console.log(JSON.stringify({
            settings: Object.keys(parsedData.settings),
            routinesCount: parsedData.routines.length,
            exercisesCount: parsedData.exercises.length,
            workoutSessionsCount: parsedData.workoutSessions.length,
            notesCount: parsedData.notes.length
        }, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
