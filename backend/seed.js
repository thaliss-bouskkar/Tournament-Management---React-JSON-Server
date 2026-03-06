const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Load models
const Admin = require('./models/Admin');
const Player = require('./models/Player');
const Team = require('./models/Team');
const Group = require('./models/Group');
const Match = require('./models/Match');
const Statistic = require('./models/Statistic');

const importData = async () => {
    try {
        // Connect to MongoDB
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        // Read the db.json file
        const dbPath = path.resolve(__dirname, '../db.json');
        if (!fs.existsSync(dbPath)) {
            console.error('db.json not found in the root directory.');
            process.exit(1);
        }
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

        console.log('Connecting to database...');

        // Clear existing data to avoid duplicates
        console.log('Clearing existing data...');
        await Admin.deleteMany();
        await Player.deleteMany();
        await Team.deleteMany();
        await Group.deleteMany();
        await Match.deleteMany();
        await Statistic.deleteMany();

        // Import the data
        console.log('Importing data from db.json...');
        if (dbData.admins && dbData.admins.length > 0) await Admin.insertMany(dbData.admins);
        if (dbData.players && dbData.players.length > 0) await Player.insertMany(dbData.players);
        if (dbData.teams && dbData.teams.length > 0) await Team.insertMany(dbData.teams);
        if (dbData.groups && dbData.groups.length > 0) await Group.insertMany(dbData.groups);
        if (dbData.matches && dbData.matches.length > 0) await Match.insertMany(dbData.matches);
        if (dbData.statistics && dbData.statistics.length > 0) await Statistic.insertMany(dbData.statistics);

        console.log('Data successfully seeded!');
        process.exit();
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

importData();
