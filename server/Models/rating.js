import mongoose from 'mongoose';

// Schema for individual match records
const matchSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true },
    matchType: { 
      type: String, 
      enum: ['BLITZ_2MIN', 'RAPID_8MIN', 'CLASSIC_12MIN'], // Game modes
      required: true 
    },
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
      ratingBefore: { type: Number, required: true },
      ratingAfter: { type: Number, required: true },
      ratingChange: { type: Number, required: true },
      // Mode-specific stats
      stats: {
        moves: { type: Number },       // For coding: submissions
        accuracy: { type: Number },    // Correct solutions %
        timeLeft: { type: Number }     // Seconds remaining
      }
    }],
    questionSet: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question' 
    }],
    startTime: { type: Date, default: Date.now },
    duration: { type: Number, required: true } // In seconds (120/480/720)
  });
// Schema for user rating statistics
const userRatingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ratings: {
      BLITZ_2MIN: {   // Separate ratings per mode
        current: { type: Number, default: 1000 },
        peak: { type: Number, default: 1000 },
        matches: { type: Number, default: 0 }
      },
      RAPID_8MIN: {
        current: { type: Number, default: 1000 },
        peak: { type: Number, default: 1000 },
        matches: { type: Number, default: 0 }
      },
      CLASSIC_12MIN: {
        current: { type: Number, default: 1000 },
        peak: { type: Number, default: 1000 },
        matches: { type: Number, default: 0 }
      }
    },
    overall: {  // Cross-mode stats
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 }
    },
    lastMatch: { type: Date },
    activity: [{  // Track all matches compactly
      matchId: String,
      mode: String,
      date: Date
    }]
  }, { timestamps: true });
// Pre-save middleware to calculate win rate
userRatingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.matchesPlayed > 0) {
        this.winRate = Math.round((this.wins / this.matchesPlayed) * 100 * 100) / 100; // Round to 2 decimal places
    }
    next();
});

// Create indexes for better query performance
matchSchema.index({ 'participants.userId': 1, matchDate: -1 });
matchSchema.index({ matchDate: -1 });
// Note: userId already has an index due to unique: true constraint
userRatingSchema.index({ currentRating: -1 });

export const Match = mongoose.model('Match', matchSchema);
export const UserRating = mongoose.model('UserRating', userRatingSchema); 