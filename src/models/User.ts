import mongoose, { Schema, Document } from 'mongoose';
import { IItems, IAddress } from '../types';

const AddressSchema = new Schema<IAddress>({
  city: String,
  state: String,
  country: String,
  street: String,
});

const UserSchema = new Schema<IItems>({
  gender: String,
  name: String,
  address: AddressSchema,
  email: String,
  age: String,
  picture: String,
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better search performance
UserSchema.index({ name: 'text', email: 'text' });
UserSchema.index({ gender: 1 });
UserSchema.index({ 'address.country': 1 });
UserSchema.index({ age: 1 });

export const User = mongoose.model<IItems & Document>('User', UserSchema); 