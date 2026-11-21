import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { conflictError, unauthorizedError } from "../utils/errors.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

function signToken(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: "admin";
}): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    env.JWT_SECRET,
    options
  );
}

export async function loginAdmin(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() })
    .select("+passwordHash")
    .lean();

  if (!user) {
    throw unauthorizedError("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw unauthorizedError("Invalid email or password");
  }

  const token = signToken(user);

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function registerAdmin(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() })
    .select("_id")
    .lean();

  if (existing) {
    throw conflictError("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const created = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "admin",
  });

  const token = signToken(created);

  return {
    token,
    user: {
      id: created._id.toString(),
      name: created.name,
      email: created.email,
      role: created.role,
    },
  };
}

export async function getAdminProfile(userId: string) {
  const user = await User.findById(userId).select("name email role createdAt").lean();
  if (!user) {
    throw unauthorizedError("Account no longer exists");
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
