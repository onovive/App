const SPREADSHEET_ID = '1Zm8VWd_U7zUFBOndy7VPe2cu4dnJgfx1P2Z1GGNhN38';
const FOLDER_ID = '1No98g5M87kVusi1iPDCtRkz9jvOejiAh';
const dataFolderID = "1310XG5zeLfaRlyp1Hv8bC60i6Cu2Gotw"

const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID)
const logSheet = spreadsheet.getSheetByName("Logs");
const dataSheet = spreadsheet.getSheetByName("Data")
const passcodeSheet = spreadsheet.getSheetByName("Passcodes")
const apiKeySheet = spreadsheet.getSheetByName("Api Key")
geminiApiKey = apiKeySheet.getRange(1, 2).getValue()

// geminiApiKey = "AIzaSyBrMthFlw8ONR2i85_QvGKXOAGhcjeEddY"// Prod
// geminiApiKey = "AIzaSyDlkkhQA-U3HxdsCYH6Ynfc7MvmHssh0_g" //Dev
//sight engine
const apiKey = '503070748';
const apiSecret = '92vp5Kk9bYdZSfc9BAXUCmsZkNPgVS7q';

// google web detection
const visionApiKey = 'AIzaSyD7gIbjPbm_Xx_ttkz2-fpnnl4YgyREycU'; // Paste API key here

