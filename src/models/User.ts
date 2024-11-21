import mongoose, { Schema, Document } from 'mongoose';
import { IItems, IAddress } from '../types';

// Interface for mongoose schema
interface IUserSchema {
  gender: string;
  name: string;
  address: IAddress;
  email: string;
  age: string;
  picture: string;
  createdAt: Date;
}

// Interface for mongoose document
export interface IUserDocument extends IUserSchema, Document {}

const AddressSchema = new Schema<IAddress>({
  city: String,
  state: String,
  country: String,
  street: String,
});

const UserSchema = new Schema<IUserDocument>({
  gender: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: AddressSchema, required: true },
  email: { type: String, required: true },
  age: { type: String, required: true },
  picture: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Add indexes for better search performance
UserSchema.index({ name: 'text', email: 'text' });
UserSchema.index({ gender: 1 });
UserSchema.index({ 'address.country': 1 });
UserSchema.index({ age: 1 });

// Method to convert document to IItems
UserSchema.methods.toItem = function(): IItems {
  return {
    id: this._id.toString(),
    gender: this.gender,
    name: this.name,
    address: this.address,
    email: this.email,
    age: this.age,
    picture: this.picture,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model<IUserDocument>('User', UserSchema); 