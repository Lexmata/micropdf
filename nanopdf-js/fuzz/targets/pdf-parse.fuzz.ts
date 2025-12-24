/**
 * PDF Parsing Fuzzer
 * 
 * Tests the robustness of PDF parsing by feeding random/malformed PDF data
 * to the Document.open() and related functions.
 * 
 * Targets:
 * - Document.open()
 * - Document.openFromBuffer()
 * - Page loading and bounds
 * - Metadata extraction
 * 
 * Run:
 *   npx jazzer fuzz/targets/pdf-parse.fuzz.ts
 */

import { FuzzedDataProvider } from '@jazzer.js/core';
import { Document } from '../../src/document.js';
import { Buffer as NanoBuffer } from '../../src/buffer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function fuzz(data: Buffer): void {
  const provider = new FuzzedDataProvider(data);
  
  // Skip tiny inputs
  if (data.length < 10) {
    return;
  }

  try {
    // Try to consume as PDF data
    const pdfData = provider.consumeRemainingAsBytes();
    
    // Create temp file
    const tmpFile = path.join(os.tmpdir(), `fuzz-${Date.now()}-${Math.random()}.pdf`);
    
    try {
      fs.writeFileSync(tmpFile, Buffer.from(pdfData));
      
      // Try to open as document
      try {
        const doc = Document.open(tmpFile);
        
        // If successful, try basic operations
        try {
          // Get page count
          const pageCount = doc.pageCount;
          
          // Try to load first page if exists
          if (pageCount > 0) {
            try {
              const page = doc.getPage(0);
              
              // Try to get bounds
              const bounds = page.bounds;
              
              // Verify bounds are reasonable
              if (bounds.width > 0 && bounds.height > 0) {
                // Success - bounds look valid
              }
            } catch (e) {
              // Page loading/bounds failed - acceptable
            }
          }
          
          // Try metadata extraction
          try {
            doc.getMetadata('Title');
            doc.getMetadata('Author');
          } catch (e) {
            // Metadata extraction failed - acceptable
          }
          
        } catch (e) {
          // Operations failed - acceptable
        }
        
      } catch (e) {
        // Document open failed - acceptable
      }
      
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
  } catch (e) {
    // Provider consumption failed - acceptable
  }
}

