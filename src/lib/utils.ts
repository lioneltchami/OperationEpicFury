import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const SITE_URL =
	process.env.SITE_URL ??
	process.env.NEXT_PUBLIC_SITE_URL ??
	"https://operation-epic-fury.vercel.app";
export const GITHUB_REPO_URL = process.env.NEXT_PUBLIC_GITHUB_REPO_URL ?? "";
export const SITE_NAME = "Operation Epic Fury";
export const SITE_NAME_FR = "Opération Epic Fury";
export const SITE_DESCRIPTION =
	"A minute-by-minute timeline of Operation Epic Fury — the US-Israel strikes on Iran.";
