// The single PrismaClient. Only repositories (and the seed) may import this.
import { PrismaClient } from "@prisma/client";
import "../config/env.js";

export const prisma = new PrismaClient();
