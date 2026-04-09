import dotenv from 'dotenv';
import { Request, Response } from 'express';
import pool from '../db';
import * as crypto from 'crypto';
import axios from 'axios';

dotenv.config();
const encryptionKey = process.env.ENCRYPTION_KEY as string;
const IPAPI_URL = process.env.IPAPI_URL as string;

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userID } = req.body;

    if (!userID) {
      res.status(400).json({ error: 'User email is required' });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    // Check if user exists
    const existingUser = await pool.query(
      `SELECT 
         pgp_sym_decrypt(first_name::bytea, $1) AS "firstName", 
         pgp_sym_decrypt(middle_name::bytea, $1) AS "middleName", 
         pgp_sym_decrypt(last_name::bytea, $1) AS "lastName", 
         pgp_sym_decrypt(phone::bytea, $1) AS "phone", 
         pgp_sym_decrypt(dob::bytea, $1) AS "dob", 
         pgp_sym_decrypt(country::bytea, $1) AS "country"
       FROM users_yn085 
       WHERE user_id = $2`,
      [encryptionKey, userIDHash],
    );

    if (existingUser.rows.length > 0) {
      res.status(200).json(existingUser.rows[0]);
      return;
    }

    // If user doesn't exist, create new user
    const newUser = await pool.query(
      `INSERT INTO users_yn085 (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING 
        RETURNING 
        pgp_sym_decrypt(first_name::bytea, $2) AS "firstName",
        pgp_sym_decrypt(middle_name::bytea, $2) AS "middleName",
        pgp_sym_decrypt(last_name::bytea, $2) AS "lastName",
        pgp_sym_decrypt(phone::bytea, $2) AS "phone",
        pgp_sym_decrypt(dob::bytea, $2) AS "dob",
        pgp_sym_decrypt(country::bytea, $2) AS country`,
      [userIDHash, encryptionKey],
    );

    res.status(200).json({ message: 'User created', user: newUser.rows[0] });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      firstName,
      middleName = null,
      lastName,
      userID,
      phone = null,
      dob = null,
      country = null,
    } = req.body;

    if (!userID) {
      res.status(400).json({ error: 'User email is required' });
      return;
    }
    if (!firstName) {
      res.status(400).json({ error: 'First name is required' });
      return;
    }
    if (!lastName) {
      res.status(400).json({ error: 'Last name is required' });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    const updatedUser = await pool.query(
      `UPDATE users_yn085 
       SET first_name = pgp_sym_encrypt($1::text, $7), 
           middle_name = pgp_sym_encrypt($2::text, $7), 
           last_name = pgp_sym_encrypt($3::text, $7), 
           phone = pgp_sym_encrypt($4::text, $7), 
           dob = pgp_sym_encrypt($5::text, $7),
           country = pgp_sym_encrypt($6::text, $7) 
       WHERE user_id = $8
       RETURNING 
       pgp_sym_decrypt(first_name::bytea, $7) AS "firstName",
       pgp_sym_decrypt(middle_name::bytea, $7) AS "middleName",
       pgp_sym_decrypt(last_name::bytea, $7) AS "lastName",
       pgp_sym_decrypt(phone::bytea, $7) AS "phone",
       pgp_sym_decrypt(dob::bytea, $7) AS "dob",
       pgp_sym_decrypt(country::bytea, $7) AS country`,
      [
        firstName,
        middleName,
        lastName,
        phone,
        dob,
        country,
        encryptionKey,
        userIDHash,
      ],
    );

    res
      .status(200)
      .json({ message: 'User updated', user: updatedUser.rows[0] });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userID } = req.body;

    if (!userID) {
      res.status(400).json({ error: 'User email is required' });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    const result = await pool.query(
      `SELECT 
         pgp_sym_decrypt(first_name::bytea, $1) AS "firstName", 
         pgp_sym_decrypt(middle_name::bytea, $1) AS "middleName", 
         pgp_sym_decrypt(last_name::bytea, $1) AS "lastName", 
         pgp_sym_decrypt(phone::bytea, $1) AS "phone", 
         pgp_sym_decrypt(dob::bytea, $1) AS "dob" 
       FROM users_yn085 
       WHERE user_id = $2`,
      [encryptionKey, userIDHash],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: result.rows[0],
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserCountry = async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(IPAPI_URL);
    res.json({
      success: true,
      country: response.data,
    });
  } catch (error: any) {
    console.error('getUserCountry => error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching country data',
    });
  }
};
