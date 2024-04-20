import { Schema } from 'mongoose';

export const DataSchema = new Schema({
  _id: Schema.Types.Mixed,
  link: String,
  name: String,
  price: String,
  type: String,
},
{
  collection: 'data',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false
});