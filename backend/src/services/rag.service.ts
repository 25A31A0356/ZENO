import { db, KnowledgeItem, QAItem, DocumentItem } from '../database/db.js';

export interface RetrievedContext {
  sourceType: 'knowledge' | 'qa' | 'document';
  title: string;
  content: string;
  relevanceScore: number;
}

export class RagService {
  /**
   * Tokenizes and normalizes text for keyword matching.
   */
  private tokenize(text: string): Set<string> {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 2);
    return new Set(tokens);
  }

  /**
   * Calculates similarity score between query tokens and target text tokens.
   */
  private calculateScore(queryTokens: Set<string>, targetText: string, weight = 1.0): number {
    if (queryTokens.size === 0 || !targetText) return 0;
    const targetLower = targetText.toLowerCase();
    let matches = 0;
    let exactSubstrings = 0;

    for (const token of queryTokens) {
      if (targetLower.includes(token)) {
        matches++;
      }
    }

    // Bonus for phrase match
    const queryStr = Array.from(queryTokens).join(' ');
    if (queryStr.length > 5 && targetLower.includes(queryStr)) {
      exactSubstrings += 2;
    }

    const score = (matches / queryTokens.size + exactSubstrings) * weight;
    return score;
  }

  /**
   * Searches the entire ZENO knowledge base for content relevant to the user's query.
   */
  search(query: string, topK = 3): RetrievedContext[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.size === 0) return [];

    const results: RetrievedContext[] = [];

    // 1. Search Direct Q&A (Highest weight)
    const qas: QAItem[] = db.getQA();
    for (const qa of qas) {
      const qScore = this.calculateScore(queryTokens, qa.question, 1.5);
      const aScore = this.calculateScore(queryTokens, qa.answer, 1.0);
      const maxScore = Math.max(qScore, aScore);
      if (maxScore > 0.3) {
        results.push({
          sourceType: 'qa',
          title: `Q&A: ${qa.question}`,
          content: qa.answer,
          relevanceScore: maxScore,
        });
      }
    }

    // 2. Search Knowledge items
    const knowledgeItems: KnowledgeItem[] = db.getKnowledge();
    for (const item of knowledgeItems) {
      const titleScore = this.calculateScore(queryTokens, item.title, 1.3);
      const tagScore = this.calculateScore(queryTokens, item.tags.join(' '), 1.2);
      const infoScore = this.calculateScore(queryTokens, item.information, 1.0);
      const maxScore = Math.max(titleScore, tagScore, infoScore);
      if (maxScore > 0.25) {
        results.push({
          sourceType: 'knowledge',
          title: `${item.title} (${item.category})`,
          content: item.information,
          relevanceScore: maxScore,
        });
      }
    }

    // 3. Search Ingested Documents
    const documents: DocumentItem[] = db.getDocuments();
    for (const doc of documents) {
      if (!doc.extractedText) continue;
      // Split into paragraphs/chunks
      const paragraphs = doc.extractedText.split(/\n\n+/);
      for (const p of paragraphs) {
        const pScore = this.calculateScore(queryTokens, p, 0.9);
        if (pScore > 0.3) {
          results.push({
            sourceType: 'document',
            title: `Doc: ${doc.originalName}`,
            content: p.trim(),
            relevanceScore: pScore,
          });
        }
      }
    }

    // Sort by score descending and return top K
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);
  }
}

export const ragService = new RagService();
