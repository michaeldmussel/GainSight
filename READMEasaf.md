# 🏋️ Workout CSV Parser

A comprehensive JavaScript parser for workout CSV data with advanced analysis capabilities. This parser can handle complex workout tracking CSV files with multiple sections including settings, routines, workout sessions, exercise logs, and notes.

## Features

- ✅ **Multi-section CSV parsing** - Handles complex CSV files with different data types
- ✅ **Exercise tracking** - Parse individual exercises with sets, reps, and weights
- ✅ **Workout sessions** - Track complete workout sessions with timing and statistics
- ✅ **Progress analysis** - Calculate personal records, volume trends, and consistency metrics
- ✅ **Notes parsing** - Extract workout notes and observations
- ✅ **Web interface** - Interactive HTML demo for file upload and visualization
- ✅ **Node.js support** - Command-line tool for batch processing
- ✅ **Export capabilities** - Generate JSON, CSV reports, and analysis summaries

## Quick Start

### Web Interface (Recommended for beginners)

1. Open `demo.html` in your web browser
2. Drag and drop your CSV file or click "Choose File"
3. View your parsed workout data with interactive charts and statistics

### Command Line (Node.js)

```bash
# Parse a CSV file
node example.js your-workout-data.csv

# Or if you have the CSV file in the current directory
node example.js strong8452961796350394804.csv
```

### Programmatic Usage

```javascript
const { WorkoutParser, WorkoutAnalyzer } = require('./workout-parser.js');

// Parse CSV content
const parser = new WorkoutParser();
const parsedData = parser.parse(csvContent);

// Analyze the data
const analyzer = new WorkoutAnalyzer(parsedData);
const personalRecords = analyzer.getPersonalRecords();
const progress = analyzer.getExerciseProgress('Barbell Bench Press');
```

## CSV File Format

The parser supports CSV files with the following sections:

### Settings Section
```csv
### SETTING ##########################################
row_id,USERID,TIMESTAMP,gender,currentRoutine,DOB,name,length,mass...
```

### Routines Section
```csv
### ROUTINES #########################################
row_id,USERID,TIMESTAMP,_id,name,difficulty,focus,dayaweek...
```

### Workout Sessions Section
```csv
### WORKOUT SESSIONS #################################
rowid,_id,USERID,edit_time,day_id,total_time,workout_time...
```

### Notes Section
```csv
### NOTES ############################################
row_id,TIMESTAMP,USERID,_id,eid,belongSys,mynote,title...
```

## Data Structure

The parser returns a structured object containing:

```javascript
{
  settings: {}, // User settings and preferences
  routines: [], // Workout routine definitions
  workoutDays: [], // Individual workout day configurations
  exercises: [], // Exercise entries with sets, reps, weights
  workoutSessions: [], // Complete workout sessions
  exerciseLogs: [], // Detailed exercise logs
  notes: [] // User notes and observations
}
```

## Analysis Features

### Personal Records
Get the heaviest weight lifted for each exercise:

```javascript
const records = analyzer.getPersonalRecords();
// Returns: { "Barbell Bench Press": { weight: 100, reps: 5, date: "2024-01-01" } }
```

### Exercise Progress
Track progress over time for specific exercises:

```javascript
const progress = analyzer.getExerciseProgress('Barbell Bench Press');
// Returns array of workout data over time with weights, reps, and volume
```

### Workout Consistency
Analyze workout frequency and gaps:

```javascript
const consistency = analyzer.getWorkoutConsistency();
// Returns: { averageGap: 3, minGap: 1, maxGap: 7, totalGaps: 20 }
```

### Volume Tracking
Calculate total training volume (weight × reps):

```javascript
const summary = parser.getSummary();
console.log(`Total volume: ${summary.totalVolume} kg×reps`);
```

## API Reference

### WorkoutParser Class

#### Methods

- `parse(csvContent)` - Parse CSV content and return structured data
- `getSummary()` - Get summary statistics
- `getExercisesByBodyPart()` - Group exercises by muscle groups
- `toJSON()` - Export parsed data as JSON string

### WorkoutAnalyzer Class

#### Methods

- `getPersonalRecords()` - Get maximum weights for each exercise
- `getExerciseProgress(exerciseName)` - Get progress data for specific exercise
- `getWorkoutConsistency()` - Analyze workout frequency patterns

## File Structure

```
workout-csv-parser/
├── workout-parser.js    # Main parser library
├── demo.html           # Interactive web interface
├── example.js          # Node.js command-line example
├── package.json        # Node.js project configuration
├── README.md          # This file
└── output/            # Generated reports (created automatically)
    ├── workout-data.json
    ├── workout-summary.json
    ├── personal-records.json
    ├── exercise-progress.json
    └── workout-report.csv
```

## Output Examples

### Summary Statistics
```json
{
  "totalWorkouts": 156,
  "totalExercises": 1247,
  "totalSets": 3892,
  "totalVolume": 125847,
  "avgWorkoutTime": 87,
  "exerciseTypes": ["Barbell Bench Press", "Squat", "Deadlift", ...]
}
```

### Personal Records
```json
{
  "Barbell Bench Press": {
    "weight": 100,
    "reps": 5,
    "date": "2024-07-15T10:30:00.000Z",
    "volume": 500
  }
}
```

### Exercise Progress
```json
[
  {
    "date": "2024-01-01T00:00:00.000Z",
    "sets": [{"weight": 80, "reps": 8}, {"weight": 85, "reps": 6}],
    "maxWeight": 85,
    "totalVolume": 1150
  }
]
```

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Node.js Compatibility

- ✅ Node.js 12.0.0+
- ✅ Works with CommonJS and ES modules

## Usage Tips

1. **Large Files**: For CSV files over 10MB, use the Node.js version for better performance
2. **Data Validation**: The parser handles malformed CSV lines gracefully
3. **Date Formats**: Supports various timestamp formats commonly used in fitness apps
4. **Weight Units**: Assumes weights are in kilograms (kg)
5. **Set Parsing**: Handles the format "weight×reps" (e.g., "80x5,85x3")

## Example Workflows

### Analyzing Progress
```javascript
// Find your strongest lifts
const records = analyzer.getPersonalRecords();
const topLifts = Object.entries(records)
  .sort((a, b) => b[1].weight - a[1].weight)
  .slice(0, 5);

// Track bench press progress over time
const benchProgress = analyzer.getExerciseProgress('Barbell Bench Press');
const trend = benchProgress.map(session => ({
  date: session.date,
  maxWeight: session.maxWeight
}));
```

### Workout Consistency
```javascript
// Check how consistent your training is
const consistency = analyzer.getWorkoutConsistency();
if (consistency.averageGap > 7) {
  console.log('Consider working out more frequently!');
}
```

### Volume Analysis
```javascript
// Find your highest volume exercises
const summary = parser.getSummary();
const topExercises = summary.exerciseTypes
  .map(name => ({
    name,
    totalVolume: analyzer.getExerciseProgress(name)
      .reduce((sum, session) => sum + session.totalVolume, 0)
  }))
  .sort((a, b) => b.totalVolume - a.totalVolume);
```

## Contributing

Feel free to submit issues and pull requests. The parser is designed to be extensible and can be adapted for different CSV formats.

## License

MIT License - feel free to use this parser in your own projects!

---

**Happy lifting! 💪**