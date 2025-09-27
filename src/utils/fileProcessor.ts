import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date';
  sampleValues: any[];
}

export interface ProcessedData {
  columns: DataColumn[];
  rows: any[];
  rowCount: number;
  fileName: string;
  fileType: 'csv' | 'xlsx';
}

export interface FileProcessingResult {
  success: boolean;
  data?: ProcessedData;
  error?: string;
}

// Detect data type based on sample values
function detectDataType(values: any[]): 'string' | 'number' | 'date' {
  const nonEmptyValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonEmptyValues.length === 0) return 'string';
  
  let numberCount = 0;
  let dateCount = 0;
  
  for (const value of nonEmptyValues.slice(0, 10)) { // Check first 10 non-empty values
    // Check if it's a number
    if (!isNaN(Number(value)) && isFinite(Number(value))) {
      numberCount++;
    }
    
    // Check if it's a date
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && 
        (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/))) {
      dateCount++;
    }
  }
  
  const total = nonEmptyValues.length;
  
  // If more than 70% are numbers, consider it a number column
  if (numberCount / total > 0.7) return 'number';
  
  // If more than 70% are dates, consider it a date column
  if (dateCount / total > 0.7) return 'date';
  
  return 'string';
}

// Process CSV file
async function processCSV(file: File): Promise<FileProcessingResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              error: `CSV parsing error: ${results.errors[0].message}`
            });
            return;
          }

          const rows = results.data as any[];
          if (rows.length === 0) {
            resolve({
              success: false,
              error: 'CSV file is empty'
            });
            return;
          }

          // Get column names from the first row
          const columnNames = Object.keys(rows[0]);
          
          // Analyze each column
          const columns: DataColumn[] = columnNames.map(name => {
            const columnValues = rows.map(row => row[name]);
            const sampleValues = columnValues.slice(0, 5).filter(v => v !== null && v !== undefined && v !== '');
            const dataType = detectDataType(columnValues);
            
            return {
              name,
              type: dataType,
              sampleValues
            };
          });

          resolve({
            success: true,
            data: {
              columns,
              rows,
              rowCount: rows.length,
              fileName: file.name,
              fileType: 'csv'
            }
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Error processing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `CSV parsing failed: ${error.message}`
        });
      }
    });
  });
}

// Process Excel file
async function processExcel(file: File): Promise<FileProcessingResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            success: false,
            error: 'Excel file has no worksheets'
          });
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null
        }) as any[][];
        
        if (jsonData.length < 2) {
          resolve({
            success: false,
            error: 'Excel file must have at least a header row and one data row'
          });
          return;
        }
        
        // First row is headers
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);
        
        // Convert to object format
        const rows = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        
        // Analyze each column
        const columns: DataColumn[] = headers.map(name => {
          const columnValues = rows.map(row => row[name]);
          const sampleValues = columnValues.slice(0, 5).filter(v => v !== null && v !== undefined && v !== '');
          const dataType = detectDataType(columnValues);
          
          return {
            name,
            type: dataType,
            sampleValues
          };
        });

        resolve({
          success: true,
          data: {
            columns,
            rows,
            rowCount: rows.length,
            fileName: file.name,
            fileType: 'xlsx'
          }
        });
      } catch (error) {
        resolve({
          success: false,
          error: `Error processing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read Excel file'
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Main file processing function
export async function processFile(file: File): Promise<FileProcessingResult> {
  const fileName = file.name.toLowerCase();
  
  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'File size must be less than 10MB'
    };
  }
  
  // Determine file type and process accordingly
  if (fileName.endsWith('.csv')) {
    return processCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processExcel(file);
  } else {
    return {
      success: false,
      error: 'Unsupported file type. Please upload CSV or Excel files.'
    };
  }
}

// Generate sample data for demo purposes
export function generateSampleData(): ProcessedData {
  const sampleRows = [
    { product: 'Product A', sales: 1250, region: 'North', date: '2024-01-15' },
    { product: 'Product B', sales: 980, region: 'South', date: '2024-01-16' },
    { product: 'Product C', sales: 750, region: 'East', date: '2024-01-17' },
    { product: 'Product D', sales: 1100, region: 'West', date: '2024-01-18' },
    { product: 'Product E', sales: 890, region: 'North', date: '2024-01-19' },
  ];
  
  const columns: DataColumn[] = [
    {
      name: 'product',
      type: 'string',
      sampleValues: ['Product A', 'Product B', 'Product C']
    },
    {
      name: 'sales',
      type: 'number',
      sampleValues: [1250, 980, 750]
    },
    {
      name: 'region',
      type: 'string',
      sampleValues: ['North', 'South', 'East']
    },
    {
      name: 'date',
      type: 'date',
      sampleValues: ['2024-01-15', '2024-01-16', '2024-01-17']
    }
  ];
  
  return {
    columns,
    rows: sampleRows,
    rowCount: sampleRows.length,
    fileName: 'sample_sales_data.csv',
    fileType: 'csv'
  };
}
