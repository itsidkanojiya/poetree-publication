/**
 * Migration utility to convert existing templates from old format (header_data) to new format (template_metadata)
 * 
 * This utility:
 * 1. Fetches all templates with old format
 * 2. Converts header_data to template_metadata structure
 * 3. Extracts header_id from header_data or uses existing header_id
 * 4. Sets default question type titles
 * 5. Updates templates via API (if migration endpoint exists) or marks for backend migration
 * 
 * Note: This may need backend support for bulk migration
 */

import apiClient from "../services/apiClient";

const DEFAULT_QUESTION_TITLES = {
  mcq: { custom_title: "A) Multiple Choice Questions" },
  short: { custom_title: "B) Short Answer Questions" },
  long: { custom_title: "C) Long Answer Questions" },
  blank: { custom_title: "D) Fill in the Blanks" },
  onetwo: { custom_title: "E) One or Two Word Answers" },
  truefalse: { custom_title: "F) True/False Questions" },
  passage: { custom_title: "G) Passage Based Questions" },
  match: { custom_title: "H) Match the Following" },
};

/**
 * Convert old template format to new format
 * @param {Object} template - Template in old format
 * @returns {Object} Template metadata in new format
 */
export const convertTemplateToNewFormat = (template) => {
  let headerId = null;
  
  // Extract header_id from header_data or use existing header_id
  if (template.header_id) {
    headerId = template.header_id;
  } else if (template.header_data) {
    try {
      const headerData = typeof template.header_data === 'string' 
        ? JSON.parse(template.header_data) 
        : template.header_data;
      
      // Try to extract header_id from header_data if it exists
      if (headerData.id) {
        headerId = headerData.id;
      }
    } catch (error) {
      console.error("Error parsing header_data:", error);
    }
  }
  
  // Create template_metadata structure
  const templateMetadata = {
    question_types: { ...DEFAULT_QUESTION_TITLES },
    header_id: headerId,
  };
  
  return templateMetadata;
};

/**
 * Migrate a single template
 * @param {Object} template - Template to migrate
 * @returns {Promise<Object>} Updated template
 */
export const migrateTemplate = async (template) => {
  try {
    // Check if template already has template_metadata
    if (template.template_metadata) {
      try {
        const metadata = typeof template.template_metadata === 'string'
          ? JSON.parse(template.template_metadata)
          : template.template_metadata;
        
        // If it already has header_id, consider it migrated
        if (metadata.header_id) {
          return { ...template, alreadyMigrated: true };
        }
      } catch (error) {
        console.error("Error parsing existing template_metadata:", error);
      }
    }
    
    // Convert to new format
    const templateMetadata = convertTemplateToNewFormat(template);
    
    // Update template via API
    const formData = new FormData();
    formData.append("template_metadata", JSON.stringify(templateMetadata));
    
    // Note: This assumes there's an update endpoint that accepts template_metadata
    // You may need to adjust this based on your actual API
    const response = await apiClient.put(`/papers/${template.id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return response.data || response;
  } catch (error) {
    console.error(`Error migrating template ${template.id}:`, error);
    throw error;
  }
};

/**
 * Migrate all templates
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Migration results
 */
export const migrateAllTemplates = async (onProgress) => {
  try {
    // Fetch all templates
    const response = await apiClient.get("/papers/templates?is_template=true");
    const templates = response?.data?.templates || response?.data?.data || response?.data || [];
    
    const results = {
      total: templates.length,
      migrated: 0,
      skipped: 0,
      errors: 0,
      errorsList: [],
    };
    
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      
      try {
        const result = await migrateTemplate(template);
        
        if (result.alreadyMigrated) {
          results.skipped++;
        } else {
          results.migrated++;
        }
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: templates.length,
            template: template.id,
            status: result.alreadyMigrated ? 'skipped' : 'migrated',
          });
        }
      } catch (error) {
        results.errors++;
        results.errorsList.push({
          templateId: template.id,
          error: error.message || "Unknown error",
        });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: templates.length,
            template: template.id,
            status: 'error',
            error: error.message,
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error migrating templates:", error);
    throw error;
  }
};

/**
 * Check if a template needs migration
 * @param {Object} template - Template to check
 * @returns {boolean} True if template needs migration
 */
export const needsMigration = (template) => {
  // Template needs migration if:
  // 1. It has header_data but no template_metadata
  // 2. It has template_metadata but no header_id
  if (template.header_data && !template.template_metadata) {
    return true;
  }
  
  if (template.template_metadata) {
    try {
      const metadata = typeof template.template_metadata === 'string'
        ? JSON.parse(template.template_metadata)
        : template.template_metadata;
      
      if (!metadata.header_id) {
        return true;
      }
    } catch (error) {
      return true;
    }
  }
  
  return false;
};

export default {
  convertTemplateToNewFormat,
  migrateTemplate,
  migrateAllTemplates,
  needsMigration,
};




