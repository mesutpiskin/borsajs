/**
 * Market-level functions for BIST data.
 */
import { getKapProvider, Company } from './providers/kap.js';

export async function companies(): Promise<Company[]> { return getKapProvider().getCompanies(); }
export async function searchCompanies(query: string): Promise<Company[]> { return getKapProvider().search(query); }
