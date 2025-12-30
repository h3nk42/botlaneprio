import { type User, type InsertUser, type Draft, type InsertDraft } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDrafts(): Promise<Draft[]>;
  getDraft(id: string): Promise<Draft | undefined>;
  createDraft(draft: InsertDraft): Promise<Draft>;
  updateDraft(id: string, draft: Partial<InsertDraft>): Promise<Draft | undefined>;
  deleteDraft(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private drafts: Map<string, Draft>;

  constructor() {
    this.users = new Map();
    this.drafts = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDrafts(): Promise<Draft[]> {
    return Array.from(this.drafts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDraft(id: string): Promise<Draft | undefined> {
    return this.drafts.get(id);
  }

  async createDraft(draft: InsertDraft): Promise<Draft> {
    const id = randomUUID();
    const now = new Date();
    const newDraft: Draft = { 
      id,
      name: draft.name,
      adcChampion: draft.adcChampion,
      allySupport: draft.allySupport || null,
      enemyAdc: draft.enemyAdc || null,
      enemySupport: draft.enemySupport || null,
      enemyThreat: draft.enemyThreat || null,
      notes: draft.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.drafts.set(id, newDraft);
    return newDraft;
  }

  async updateDraft(id: string, draft: Partial<InsertDraft>): Promise<Draft | undefined> {
    const existing = this.drafts.get(id);
    if (!existing) return undefined;
    
    const updated: Draft = {
      ...existing,
      ...draft,
      updatedAt: new Date()
    };
    this.drafts.set(id, updated);
    return updated;
  }

  async deleteDraft(id: string): Promise<boolean> {
    return this.drafts.delete(id);
  }
}

export const storage = new MemStorage();
