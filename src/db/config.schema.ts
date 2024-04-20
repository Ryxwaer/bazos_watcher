import { Schema } from 'mongoose';

export const ConfigSchema = new Schema({
  _id: Schema.Types.Mixed,
  subject: String,
  recipients: String,
  url: String,
  enabled: Boolean,
},
{
  collection: 'config'
});
