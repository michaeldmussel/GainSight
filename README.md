# 🏋️ Multi-Format Workout CSV Parser

A comprehensive JavaScript parser that supports **multiple workout CSV formats** with advanced analysis capabilities. This parser automatically detects and handles different workout tracking apps and data formats.

## 🎯 Supported Formats

### Format 1: Strong App CSV
- **Source**: Strong (iOS/Android workout tracking app)
- **Structure**: Single table with columns like "Workout #", "Exercise Name", "Set Order", "Weight (kg)", "Reps"
- **Separator**: Semicolon (`;`)
- **Features**: Supports weight exercises, cardio (distance/time), RPE, notes

### Format 2: Multi-Section CSV  
- **Source**: Advanced workout tracking systems
- **Structure**: Multiple sections with settings, routines, workout sessions, exercise logs, notes
- **Separator**: Comma (`,`)
- **Features**: Complete workout ecosystem with user settings, routine planning, detailed analytics

## ✨ Features

- ✅ **Auto-format detection** - Automatically identifies CSV format
- ✅ **Multi-section parsing** - Handles complex CSV files with different data types
- ✅ **Exercise tracking** - Parses sets/reps/weights, cardio data (distance/time)
- ✅ **Personal records** - Finds your heaviest lifts for each exercise
- ✅ **Progress analysis** - Tracks improvement over time
- ✅ **Workout consistency** - Analyzes gaps between workouts
- ✅ **Volume calculations** - Computes total training volume (weight × reps)
- ✅ **Cardio support** - Tracks running, cycling, and time-based exercises
- ✅ **Web interface** - Interactive HTML demo for file upload and visualization
- ✅ **Node.js support** - Command-line tool for batch processing
- ✅ **Export capabilities** - JSON, CSV reports, and analysis summaries

## 🚀 Quick Start

### 🌐 Live Demo
**Try it now:** [GitHub Pages Demo](https://michaeldmussel.github.io/GainSight/)

Upload your workout CSV file and get instant analysis with interactive charts!

### Web Interface (Local)
1. Open `index.html` in your web browser
2. Drag and drop your CSV file (any supported format)
3. View your parsed workout data with interactive charts and statistics

### Command Line
```bash
# Parse any supported CSV format
node example.js your-workout-data.csv

# Strong app export
node example.js strong-export.csv

# Multi-section format
node example.js advanced-workout-data.csv
```

### Programmatic Usage
```javascript
const { MultiFormatWorkoutParser, EnhancedWorkoutAnalyzer } = require('./workout-parser.js');

// Auto-detect format and parse
const parser = new MultiFormatWorkoutParser();
const data = parser.parse(csvContent);
console.log(`Detected format: ${parser.detectedFormat}`);

// Analyze the data
const analyzer = new EnhancedWorkoutAnalyzer(data);
const personalRecords = analyzer.getPersonalRecords();
const progress = analyzer.getExerciseProgress('Bench Press (Barbell)');
```

## 📊 Example Results

### Strong Format Analysis
```
Format detected: strong
📊 Workouts: 149
💪 Exercises: 974  
🎯 Total Volume: 712,244 kg×reps
⏱️ Avg Workout: 130 minutes
🏃 Unique Exercises: 61
🏆 Personal Records: 51 exercises
🥇 Top PR: Leg Press - 95kg × 10 reps
🏃 Cardio Exercises: 19
💪 Strength Exercises: 880
📏 Total Distance: 28,600m
📅 Avg Gap: 5 days between workouts
```

### Multi-Section Format Analysis
```
Format detected: multi-section
📊 Workouts: 213
💪 Exercises: 121
🎯 Total Volume: 90,923 kg×reps
⏱️ Avg Workout: 87 minutes
🏃 Unique Exercises: 52
🏆 Personal Records: 51 exercises
🥇 Top PR: Machine Calf Press - 140kg × 12 reps
📅 Avg Gap: 3 days between workouts
```

## 📁 CSV Format Examples

### Strong App Format
```csv
"Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"
"1";"2024-08-06 13:59:53";"Push Day";"1200";"Bench Press (Barbell)";"1";"80.0";"8";"";"";"";"";""
"1";"2024-08-06 13:59:53";"Push Day";"1200";"Bench Press (Barbell)";"2";"80.0";"6";"";"";"";"";""
"1";"2024-08-06 13:59:53";"Push Day";"1200";"Running";"1";"";"";"";"2000.0";"600.0";"";""
```

### Multi-Section Format
```csv
### SETTING ##########################################
row_id,USERID,TIMESTAMP,gender,currentRoutine,DOB,name,length,mass...

### ROUTINES #########################################
row_id,USERID,TIMESTAMP,_id,name,difficulty,focus,dayaweek...

### WORKOUT SESSIONS #################################
rowid,_id,USERID,edit_time,day_id,total_time,workout_time...
```

## 🛠️ API Reference

### MultiFormatWorkoutParser Class

#### Methods
- `parse(csvContent)` - Auto-detect format and parse CSV content
- `detectFormat(csvContent)` - Determine CSV format ('strong' or 'multi-section')
- `getSummary()` - Get format-aware summary statistics
- `getExercisesByBodyPart()` - Group exercises by muscle groups
- `toJSON()` - Export parsed data as JSON string

#### Properties
- `detectedFormat` - The detected CSV format after parsing

### EnhancedWorkoutAnalyzer Class

#### Methods
- `getPersonalRecords()` - Get maximum weights for each exercise
- `getExerciseProgress(exerciseName)` - Get progress data for specific exercise
- `getWorkoutConsistency()` - Analyze workout frequency patterns
- `getCardioExercises()` - Get cardio/distance-based exercises (Strong format)
- `getStrengthExercises()` - Get weight-based exercises

## 🎯 Data Structure

Both formats are normalized to a standard structure:

```javascript
{
  settings: {}, // User settings and preferences
  routines: [], // Workout routine definitions  
  workoutDays: [], // Individual workout day configurations
  exercises: [], // Exercise entries with sets, reps, weights
  workoutSessions: [], // Complete workout sessions
  exerciseLogs: [], // Detailed exercise logs
  notes: [], // User notes and observations
  format: 'strong' | 'multi-section', // Detected format
  dateRange: { start: Date, end: Date, span: number }
}
```

## 🏃 Strong Format Features

### Cardio Exercise Support
- **Running**: Distance (meters) and time tracking
- **Cycling**: Distance and duration
- **Time-based exercises**: Plank, etc.

### Strength Exercise Support  
- **Weight exercises**: Barbell, dumbbell, machine exercises
- **Bodyweight**: Push-ups, pull-ups, etc.
- **RPE tracking**: Rate of Perceived Exertion
- **Set notes**: Exercise-specific notes

## 📈 Analysis Features

### Progress Tracking
```javascript
// Track bench press progress over time
const progress = analyzer.getExerciseProgress('Bench Press (Barbell)');
progress.forEach(session => {
  console.log(`${session.date}: ${session.maxWeight}kg for ${session.totalSets} sets`);
});
```

### Personal Records
```javascript
// Get all-time personal records
const records = analyzer.getPersonalRecords();
Object.entries(records).forEach(([exercise, record]) => {
  console.log(`${exercise}: ${record.weight}kg × ${record.reps} reps`);
});
```

### Cardio Analysis (Strong Format)
```javascript
// Get cardio exercise data
const cardio = analyzer.getCardioExercises();
cardio.forEach(exercise => {
  console.log(`${exercise.name}: ${exercise.totalDistance}m total distance`);
});
```

## 📂 File Structure

```
workout-csv-parser/
├── workout-parser.js          # Main parser library (multi-format)
├── demo.html                  # Interactive web interface
├── example.js                 # Node.js command-line tool
├── test-multi-format.js       # Multi-format test suite
├── package.json               # Node.js project configuration
├── README.md                  # This file
├── strong8452961796350394804.csv  # Sample Strong format CSV
└── output/                    # Generated reports (auto-created)
    ├── workout-data.json      # Complete parsed data
    ├── workout-summary.json   # Summary statistics
    ├── personal-records.json  # Personal records
    ├── exercise-progress.json # Progress tracking data
    └── workout-report.csv     # Exportable CSV report
```

## 💻 Browser & Node.js Compatibility

### Browser Support
- ✅ Chrome 60+
- ✅ Firefox 55+  
- ✅ Safari 12+
- ✅ Edge 79+

### Node.js Support
- ✅ Node.js 12.0.0+
- ✅ Works with CommonJS and ES modules

## 🔧 Usage Tips

1. **Large Files**: For CSV files over 10MB, use the Node.js version for better performance
2. **Format Detection**: The parser automatically detects format - no manual configuration needed
3. **Data Validation**: Both parsers handle malformed CSV lines gracefully
4. **Date Formats**: Supports various timestamp formats from different apps
5. **Weight Units**: Assumes weights are in kilograms (kg)
6. **Distance Units**: Distance in meters for cardio exercises
7. **Set Parsing**: Strong format supports individual sets, multi-section uses "weight×reps" format

## 🎮 Getting Started Examples

### Analyzing Strong App Data
```javascript
const parser = new MultiFormatWorkoutParser();
const data = parser.parse(strongCsvContent);
const analyzer = new EnhancedWorkoutAnalyzer(data);

// Get cardio summary
const cardio = analyzer.getCardioExercises();
console.log(`Total running distance: ${cardio.reduce((sum, ex) => sum + ex.totalDistance, 0)}m`);

// Find heaviest lifts
const records = analyzer.getPersonalRecords();
const heaviestLifts = Object.entries(records)
  .sort((a, b) => b[1].weight - a[1].weight)
  .slice(0, 5);
```

### Comparing Two Different Apps
```javascript
// Parse data from two different workout apps
const strongData = strongParser.parse(strongCsv);
const advancedData = advancedParser.parse(advancedCsv);

// Compare training volumes
console.log(`Strong total volume: ${strongData.exercises.reduce((sum, ex) => sum + (ex.totalVolume || 0), 0)}`);
console.log(`Advanced total volume: ${advancedData.exercises.reduce((sum, ex) => sum + (ex.totalVolume || 0), 0)}`);
```

## 🤝 Contributing

The parser is designed to be extensible! To add support for new formats:

1. Extend `MultiFormatWorkoutParser`
2. Add format detection logic in `detectFormat()`
3. Implement parsing method for new format
4. Add tests in `test-multi-format.js`

## 📄 License

MIT License - feel free to use this parser in your own projects!

---

**Track your gains across any platform! 💪📊**