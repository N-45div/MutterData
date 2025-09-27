// Enhanced Data Parser using PapaParse + ExcelJS
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export interface ParsedDataResult {
  data: any[];
  columns: string[];
  rowCount: number;
  columnCount: number;
  metadata: {
    fileType: string;
    fileName: string;
    sheetNames?: string[];
    dataTypes: Record<string, string>;
    sampleValues: Record<string, any[]>;
    statistics: Record<string, any>;
  };
}

export interface DataStatistics {
  min?: number;
  max?: number;
  avg?: number;
  median?: number;
  mode?: any;
  nullCount: number;
  uniqueCount: number;
  dataType: 'number' | 'string' | 'date' | 'boolean' | 'mixed';
}

/**
 * Enhanced CSV Parser using PapaParse
 */
export async function parseCSVFile(file: File): Promise<ParsedDataResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-convert numbers and booleans
      complete: (results) => {
        try {
          const data = results.data as any[];
          const columns = results.meta.fields || [];
          
          // Generate metadata and statistics
          const metadata = generateMetadata(data, columns, 'csv', file.name);
          
          resolve({
            data,
            columns,
            rowCount: data.length,
            columnCount: columns.length,
            metadata
          });
        } catch (error) {
          reject(new Error(`CSV parsing failed: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

/**
 * Enhanced Excel Parser using ExcelJS
 */
export async function parseExcelFile(file: File): Promise<ParsedDataResult> {
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    
    await workbook.xlsx.load(arrayBuffer);
    
    // Get the first worksheet (or most data-rich one)
    const worksheet = findBestWorksheet(workbook);
    
    if (!worksheet) {
      throw new Error('No valid worksheet found in Excel file');
    }
    
    // Extract data and headers
    const { data, columns } = extractWorksheetData(worksheet);
    
    // Generate metadata
    const sheetNames = workbook.worksheets.map(ws => ws.name);
    const metadata = generateMetadata(data, columns, 'excel', file.name, sheetNames);
    
    return {
      data,
      columns,
      rowCount: data.length,
      columnCount: columns.length,
      metadata
    };
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error}`);
  }
}

/**
 * Find the worksheet with the most data
 */
function findBestWorksheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  let bestWorksheet: ExcelJS.Worksheet | null = null;
  let maxRows = 0;
  
  workbook.worksheets.forEach(worksheet => {
    const rowCount = worksheet.rowCount;
    if (rowCount > maxRows) {
      maxRows = rowCount;
      bestWorksheet = worksheet;
    }
  });
  
  return bestWorksheet;
}

/**
 * Extract data and columns from Excel worksheet
 */
function extractWorksheetData(worksheet: ExcelJS.Worksheet): { data: any[], columns: string[] } {
  const data: any[] = [];
  const columns: string[] = [];
  
  // Get headers from first row
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const headerValue = cell.value?.toString() || `Column${colNumber}`;
    columns.push(headerValue);
  });
  
  // Extract data rows
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowData: any = {};
    
    let hasData = false;
    row.eachCell((cell, colNumber) => {
      const columnName = columns[colNumber - 1];
      if (columnName) {
        let cellValue = cell.value;
        
        // Handle different cell types
        if (cellValue && typeof cellValue === 'object') {
          // Handle dates
          if (cellValue instanceof Date) {
            cellValue = cellValue.toISOString();
          }
          // Handle formulas
          else if ('result' in cellValue) {
            cellValue = cellValue.result;
          }
          // Handle rich text
          else if ('richText' in cellValue) {
            cellValue = cellValue.richText.map((rt: any) => rt.text).join('');
          }
        }
        
        rowData[columnName] = cellValue;
        if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
          hasData = true;
        }
      }
    });
    
    // Only add rows that have some data
    if (hasData) {
      data.push(rowData);
    }
  }
  
  return { data, columns };
}

/**
 * Generate comprehensive metadata and statistics
 */
function generateMetadata(
  data: any[], 
  columns: string[], 
  fileType: string, 
  fileName: string,
  sheetNames?: string[]
): ParsedDataResult['metadata'] {
  const dataTypes: Record<string, string> = {};
  const sampleValues: Record<string, any[]> = {};
  const statistics: Record<string, DataStatistics> = {};
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
    const sampleVals = values.slice(0, 5); // First 5 non-null values
    
    // Determine data type
    const dataType = inferDataType(values);
    dataTypes[column] = dataType;
    sampleValues[column] = sampleVals;
    
    // Calculate statistics
    statistics[column] = calculateColumnStatistics(values, dataType);
  });
  
  return {
    fileType,
    fileName,
    sheetNames,
    dataTypes,
    sampleValues,
    statistics
  };
}

/**
 * Infer data type from values
 */
function inferDataType(values: any[]): string {
  if (values.length === 0) return 'string';
  
  const types = new Set();
  
  values.forEach(value => {
    if (typeof value === 'number') {
      types.add('number');
    } else if (typeof value === 'boolean') {
      types.add('boolean');
    } else if (value instanceof Date || isDateString(value)) {
      types.add('date');
    } else {
      types.add('string');
    }
  });
  
  if (types.size === 1) {
    return Array.from(types)[0] as string;
  } else if (types.has('number') && types.size === 2 && types.has('string')) {
    // Check if strings are actually numbers
    const numericValues = values.filter(v => !isNaN(parseFloat(v)));
    if (numericValues.length > values.length * 0.8) {
      return 'number';
    }
  }
  
  return 'mixed';
}

/**
 * Check if string is a date
 */
function isDateString(value: any): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.length > 8;
}

/**
 * Calculate comprehensive statistics for a column
 */
function calculateColumnStatistics(values: any[], dataType: string): DataStatistics {
  const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
  const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const uniqueValues = [...new Set(validValues)];
  
  const stats: DataStatistics = {
    nullCount,
    uniqueCount: uniqueValues.length,
    dataType: dataType as any
  };
  
  if (dataType === 'number' && validValues.length > 0) {
    const numbers = validValues.map(v => parseFloat(v)).filter(n => !isNaN(n));
    if (numbers.length > 0) {
      stats.min = Math.min(...numbers);
      stats.max = Math.max(...numbers);
      stats.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      
      // Calculate median
      const sorted = numbers.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.median = sorted.length % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];
    }
  }
  
  // Calculate mode (most frequent value)
  if (validValues.length > 0) {
    const frequency: Record<string, number> = {};
    validValues.forEach(value => {
      const key = String(value);
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    const maxFreq = Math.max(...Object.values(frequency));
    const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq);
    stats.mode = modes.length === 1 ? modes[0] : modes;
  }
  
  return stats;
}

/**
 * Universal file parser - detects file type and uses appropriate parser
 */
export async function parseDataFile(file: File): Promise<ParsedDataResult> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSVFile(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file);
  } else {
    throw new Error(`Unsupported file type: ${fileName}. Please upload CSV or Excel files.`);
  }
}

/**
 * Generate insights from parsed data
 */
export function generateDataInsights(parsedData: ParsedDataResult): string[] {
  const insights: string[] = [];
  const { data, columns, metadata } = parsedData;
  
  // Basic insights
  insights.push(`Dataset contains ${data.length} rows and ${columns.length} columns`);
  
  // Data quality insights
  const columnsWithNulls = Object.entries(metadata.statistics)
    .filter(([_, stats]) => stats.nullCount > 0)
    .length;
  
  if (columnsWithNulls > 0) {
    insights.push(`${columnsWithNulls} columns have missing data`);
  }
  
  // Numeric column insights
  const numericColumns = Object.entries(metadata.dataTypes)
    .filter(([_, type]) => type === 'number')
    .map(([col, _]) => col);
  
  if (numericColumns.length > 0) {
    insights.push(`Found ${numericColumns.length} numeric columns for analysis: ${numericColumns.slice(0, 3).join(', ')}`);
    
    // Find columns with high variance
    numericColumns.forEach(col => {
      const stats = metadata.statistics[col];
      if (stats.min !== undefined && stats.max !== undefined && stats.avg !== undefined) {
        const range = stats.max - stats.min;
        const coefficient = range / stats.avg;
        if (coefficient > 2) {
          insights.push(`${col} shows high variability (range: ${stats.min.toFixed(1)} - ${stats.max.toFixed(1)})`);
        }
      }
    });
  }
  
  // Categorical insights
  const categoricalColumns = Object.entries(metadata.dataTypes)
    .filter(([_, type]) => type === 'string')
    .map(([col, _]) => col);
  
  if (categoricalColumns.length > 0) {
    insights.push(`Found ${categoricalColumns.length} categorical dimensions for segmentation`);
  }
  
  return insights;
}
