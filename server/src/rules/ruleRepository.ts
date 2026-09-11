/**
 * Rule Repository
 * 
 * ARCHITECTURAL DECISION: Rules are stored as JSON files, loaded at startup,
 * and served via simple accessor functions. This keeps the rule data 
 * independent from the rule engine logic.
 * 
 * In production, rules could be loaded from a database, versioned, and
 * updated without restarting the server.
 */

import { RuleDefinition } from '../types';
import demoRulesData from './demo-rules.json';

// Load and type-assert the rules
const allRules: RuleDefinition[] = demoRulesData.rules as RuleDefinition[];

/**
 * Get all rules, optionally filtered by category
 */
export function getRules(category?: string): RuleDefinition[] {
  if (category) {
    return allRules.filter(r => r.category === category);
  }
  return allRules;
}

/**
 * Get only required rules (fields that MUST be present)
 */
export function getRequiredRules(category?: string): RuleDefinition[] {
  return getRules(category).filter(r => r.required);
}

/**
 * Get a specific rule by ID
 */
export function getRuleById(ruleId: string): RuleDefinition | undefined {
  return allRules.find(r => r.ruleId === ruleId);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  return [...new Set(allRules.map(r => r.category))];
}
