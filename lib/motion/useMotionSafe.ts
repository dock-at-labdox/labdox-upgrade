"use client";

import { useReducedMotion } from "framer-motion";

export const useMotionSafe = () => !useReducedMotion();
