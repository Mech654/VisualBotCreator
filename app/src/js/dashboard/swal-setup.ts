// Remove all imports of SweetAlert2. It is now loaded via <script> in index.html

declare global {
  // Remove the explicit type and use 'var' to match the global.d.ts declaration if present
  // If this still fails, remove this block entirely and rely on the global.d.ts declaration
}

// SweetAlert2 dashboard modal custom CSS setup
export function setupSwalDashboardModalStyle() {
  if (document.getElementById('swal-dashboard-style')) return; // Prevent duplicate style

  const swalStyle = document.createElement('style');
  swalStyle.id = 'swal-dashboard-style';
  swalStyle.innerHTML = `
  .swal2-dashboard-bot-modal {
  padding: 28px !important;
  border-radius: 12px !important;
  background: #252525 !important; /* $surface-alt */
  color: #ffffff !important; /* $on-surface / $text-primary */
  box-shadow: 0 12px 40px rgba(0,0,0,0.35) !important;
}
.swal2-dashboard-bot-modal .swal2-title {
  font-size: 1.8em !important;
  margin-bottom: 1em !important;
  color: #ffffff !important; /* $text-primary */
  font-weight: 600 !important;
  text-align: left;
}
.swal2-dashboard-bot-modal .swal2-html-container {
  font-size: 1em !important;
  line-height: 1.6 !important;
  text-align: left;
  margin: 0 !important;
  padding: 0 !important;
}
.swal2-dashboard-bot-modal .swal-bot-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  text-align: left;
}
.swal2-dashboard-bot-modal .swal-detail-category {
  border: 1px solid #333333; /* $border-color */
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #1e1e1e; /* $surface */
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.swal2-dashboard-bot-modal .swal-category-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #ffffff; /* $text-primary */
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #333333; /* $border-color */
}
.swal2-dashboard-bot-modal .swal-category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.swal2-dashboard-bot-modal .swal-category-header .swal-category-title {
  margin-bottom: 0;
  border-bottom: none;
}
.swal2-dashboard-bot-modal .swal-detail-item {
  margin-bottom: 12px;
  font-size: 1em;
}
.swal2-dashboard-bot-modal .swal-detail-item:last-child {
  margin-bottom: 0;
}
.swal2-dashboard-bot-modal b {
  color: #03dac6 !important; /* $secondary */
  font-weight: 500 !important;
}

/* Inline input for bot name and description */
.swal2-dashboard-bot-modal .swal-inline-input {
  background-color: transparent;
  color: #ffffff; /* $on-surface / $text-primary */
  border: none;
  border-bottom: 1px solid #333333; /* $border-color */
  font-size: 1em;
  padding: 4px 0;
  margin-left: 8px;
  width: calc(100% - 100px); /* Adjust width as needed */
}
.swal2-dashboard-bot-modal .swal-inline-input:focus {
  outline: none;
  border-bottom: 1px solid #bb86fc; /* $primary */
}

/* Run Conditions List Styling */
.swal2-dashboard-bot-modal .swal-rc-list {
  list-style-type: decimal;
  margin: 0.5em 0 1.2em 0.5em;
  padding-left: 1.75em;
}
.swal2-dashboard-bot-modal .swal-rc-list li {
  margin-bottom: 0.8em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #2d2d2d; /* $surface-variant */
  border-radius: 6px;
}
.swal2-dashboard-bot-modal .swal-rc-list li span {
  flex-grow: 1;
  color: #b0b0b0; /* $text-secondary */
}
.swal2-dashboard-bot-modal .swal-rc-list li span b {
  color: #bb86fc !important; /* $primary */
}
.swal2-dashboard-bot-modal .swal-rc-no-conditions {
  font-style: italic;
  color: #888888; /* $text-hint */
  list-style-type: none !important;
  margin-left: -1.5em;
  padding: 8px 0 !important;
  background-color: transparent !important;
}
.swal2-dashboard-bot-modal .swal-delete-rc-btn {
  background: #cf6679; /* $danger / $accent */
  border: none;
  color: white;
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  padding: 5px 8px;
  margin-left: 12px;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  line-height: 16px;
  text-align: center;
  transition: background-color 0.2s, transform 0.1s;
}
.swal2-dashboard-bot-modal .swal-delete-rc-btn:hover {
  background-color: #b85266; /* Darker or less intense $danger */
  transform: scale(1.1);
}

/* Add Condition Button Styling */
.swal2-dashboard-bot-modal .swal-add-rc-btn {
  background-color: transparent;
  color: #bb86fc; /* $primary, for the plus symbol */
  border: none;
  padding: 0 5px; /* Minimal padding around the plus */
  font-size: 1.5em; /* Size of the plus symbol */
  line-height: 1; /* Ensure it aligns well vertically */
  cursor: pointer;
  margin-left: 8px; /* Add some space from the title */
}
.swal2-dashboard-bot-modal .swal-add-rc-btn:hover {
  color: #a367e8; /* Darker $primary on hover */
  background-color: transparent; /* Ensure no background on hover */
  transform: none; /* Remove any transform if previously added */
}
.swal2-dashboard-bot-modal .swal-add-rc-btn::before { 
  content: '+';
  font-weight: bold; 
}

/* Add Condition Form Styling */
.swal2-dashboard-bot-modal .swal-add-rc-form {
  margin-top: 18px;
  padding: 20px;
  background: #1e1e1e; /* $surface */
  border-radius: 8px;
  border: 1px solid #333333; /* $border-color */
}
.swal2-dashboard-bot-modal .swal-add-rc-title {
  font-size: 1.2em;
  color: #ffffff; /* $text-primary */
  margin-bottom: 15px;
  font-weight: 500;
}
.swal2-dashboard-bot-modal .swal-rc-select,
.swal2-dashboard-bot-modal .swal-rc-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 5px;
  border: 1px solid #333333; /* $border-color */
  background-color: #121212; /* $background */
  color: #ffffff; /* $on-background */
  font-size: 1em;
}
.swal2-dashboard-bot-modal .swal-rc-select:focus,
.swal2-dashboard-bot-modal .swal-rc-input:focus {
  border-color: #bb86fc; /* $primary */
  box-shadow: 0 0 0 0.2rem rgba(187, 134, 252, 0.25); /* Shadow based on $primary */
  outline: none;
}
.swal2-dashboard-bot-modal .swal-rc-form-actions {
  margin-top: 15px;
  text-align: right;
}
.swal2-dashboard-bot-modal .swal-save-rc-btn,
.swal2-dashboard-bot-modal .swal-cancel-rc-btn {
  padding: 5px 10px; /* Further reduced padding */
  font-size: 0.85em; /* Further reduced font size */
  border-radius: 4px; /* Slightly smaller radius */
  cursor: pointer;
  border: none;
  margin-left: 10px;
  font-weight: 500;
  transition: background-color 0.2s, transform 0.1s;
}
.swal2-dashboard-bot-modal .swal-save-rc-btn {
  background-color: #2ecc71; /* $success */
  color: white;
}
.swal2-dashboard-bot-modal .swal-save-rc-btn:hover {
  background-color: #28b868; /* Slightly darker/less intense $success */
  transform: translateY(-1px);
}
.swal2-dashboard-bot-modal .swal-cancel-rc-btn {
  background-color: #2d2d2d; /* $surface-variant */
  color: #ffffff; /* $text-primary */
}
.swal2-dashboard-bot-modal .swal-cancel-rc-btn:hover {
  background-color: #424242; /* Lighter gray or $surface */
  transform: translateY(-1px);
}

/* General Toggle Button Styling */
.swal2-dashboard-bot-modal #swal-toggle-btn {
  font-size: 0.85em !important; /* Further reduced font size */
  border-radius: 14px !important; /* Slightly smaller radius */
  border: none !important;
  min-width: 50px !important; /* Adjusted min-width */
  font-weight: 500 !important;
  padding: 4px 10px !important; /* Further reduced padding */
  transition: background-color 0.25s ease, color 0.25s ease, transform 0.1s ease !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.swal2-dashboard-bot-modal #swal-toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.25);
}
.swal2-dashboard-bot-modal #swal-toggle-btn[style*='#4caf50'] { /* Active state */
  background: #2ecc71 !important; /* $success */
  color: #ffffff !important;
}
.swal2-dashboard-bot-modal #swal-toggle-btn[style*='#ccc'] { /* Inactive state */
  background: #2d2d2d !important; /* $surface-variant */
  color: #b0b0b0 !important; /* $text-secondary */
}

/* OK Button Styling */
.swal2-dashboard-bot-modal .swal2-confirm {
  background-color: #bb86fc !important; /* $primary */
  color: #ffffff !important; /* $text-primary / $on-background (Changed from #000000) */
  border-radius: 5px !important; /* Slightly smaller radius */
  font-size: 0.9em !important; /* Further reduced font size */
  padding: 0.4em 1em !important; /* Further reduced padding */
  margin-top: 20px; 
  font-weight: 500;
}

.swal2-dashboard-bot-modal .swal2-confirm:hover {
  background-color: #a367e8 !important; /* Darker $primary */
}

/* Close Button Styling */
.swal2-dashboard-bot-modal .swal2-close {
  color: #b0b0b0 !important; /* $text-secondary */
  font-size: 1.6em !important;
}
.swal2-dashboard-bot-modal .swal2-close:hover {
  color: #ffffff !important; /* $text-primary */
}
  `;
  document.head.appendChild(swalStyle);
}
