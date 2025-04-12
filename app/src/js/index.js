// Script for index.html (Dashboard)
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard script loaded');

  // Handle bot card actions - improved to show dropdown menu
  document.querySelectorAll('.bot-action').forEach(action => {
    action.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Remove any existing dropdown menus
      document.querySelectorAll('.action-dropdown').forEach(dropdown => dropdown.remove());
      
      // Create dropdown menu
      const dropdown = document.createElement('div');
      dropdown.className = 'action-dropdown';
      
      // Add action items
      const actions = [
        { icon: '✏️', text: 'Edit', action: 'edit' },
        { icon: '🔄', text: 'Duplicate', action: 'duplicate' },
        { icon: '⚙️', text: 'Settings', action: 'settings' },
        { icon: '🗑️', text: 'Delete', action: 'delete', danger: true }
      ];
      
      actions.forEach(item => {
        const actionItem = document.createElement('div');
        actionItem.className = 'dropdown-item';
        if (item.danger) actionItem.classList.add('danger');
        
        actionItem.innerHTML = `<span class="dropdown-icon">${item.icon}</span>${item.text}`;
        
        actionItem.addEventListener('click', () => {
          handleBotAction(item.action, e.target.closest('.bot-card'));
          dropdown.remove();
        });
        
        dropdown.appendChild(actionItem);
      });
      
      // Position the dropdown
      action.appendChild(dropdown);
      
      // Close dropdown when clicking elsewhere
      document.addEventListener('click', function closeDropdown(evt) {
        if (!evt.target.closest('.bot-action')) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      });
    });
  });
  
  // Function to handle bot actions
  function handleBotAction(action, botCard) {
    const botName = botCard.querySelector('.bot-name').textContent;
    
    switch(action) {
      case 'edit':
        showPageTransition('builder.html');
        break;
      case 'duplicate':
        // Show visual feedback
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `<span>✅</span> Bot "${botName}" duplicated successfully!`;
        document.body.appendChild(notification);
        
        // Automatically remove after 3 seconds
        setTimeout(() => {
          notification.classList.add('fade-out');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
        break;
      case 'settings':
        // For demo, just toggle the bot status
        const statusDot = botCard.querySelector('.status-dot');
        const statusText = botCard.querySelector('.bot-status');
        
        if (statusDot.classList.contains('status-active')) {
          statusDot.classList.remove('status-active');
          statusDot.classList.add('status-offline');
          statusText.innerHTML = '<div class="status-dot status-offline"></div>Offline';
        } else {
          statusDot.classList.remove('status-offline');
          statusDot.classList.add('status-active');
          statusText.innerHTML = '<div class="status-dot status-active"></div>Active';
        }
        break;
      case 'delete':
        // Show confirmation dialog
        const dialog = document.createElement('div');
        dialog.className = 'confirmation-dialog';
        dialog.innerHTML = `
          <div class="dialog-content">
            <h3>Delete Bot</h3>
            <p>Are you sure you want to delete "${botName}"? This action cannot be undone.</p>
            <div class="dialog-actions">
              <button class="btn btn-outline dialog-cancel">Cancel</button>
              <button class="btn btn-danger dialog-confirm">Delete</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add modal backdrop
        setTimeout(() => dialog.classList.add('active'), 10);
        
        // Handle dialog actions
        dialog.querySelector('.dialog-cancel').addEventListener('click', () => {
          dialog.classList.remove('active');
          setTimeout(() => dialog.remove(), 300);
        });
        
        dialog.querySelector('.dialog-confirm').addEventListener('click', () => {
          botCard.style.height = botCard.offsetHeight + 'px';
          botCard.classList.add('fade-out');
          
          setTimeout(() => {
            botCard.style.height = '0';
            botCard.style.margin = '0';
            botCard.style.padding = '0';
            botCard.style.overflow = 'hidden';
            
            setTimeout(() => {
              botCard.remove();
              
              // Update bot count
              const countElement = document.querySelector('.section-title > span');
              const currentCount = parseInt(countElement.textContent);
              countElement.textContent = `${currentCount - 1} bots`;
              
              // Show empty state if no bots left
              if (currentCount - 1 === 0) {
                document.querySelector('.bot-list').style.display = 'none';
                document.querySelector('.empty-state').style.display = 'flex';
              }
            }, 300);
          }, 10);
          
          dialog.classList.remove('active');
          setTimeout(() => dialog.remove(), 300);
        });
        break;
    }
  }

  // Page transition effect function
  function showPageTransition(destination) {
    const pageTransition = document.querySelector('.page-transition');
    pageTransition.classList.add('active');
    
    // Wait for animation before navigating
    setTimeout(() => {
      window.location.href = destination;
    }, 400);
  }

  // Navigate to builder on clicking "Create New Bot" button with transition
  document.querySelector('.btn-primary').addEventListener('click', () => {
    showPageTransition('builder.html');
  });

  // Navigate to builder when clicking on a bot template with transition
  document.querySelectorAll('.schema-card').forEach(card => {
    card.addEventListener('click', () => {
      showPageTransition('builder.html');
    });
  });

  // Navigate to builder when clicking on a bot card with transition
  document.querySelectorAll('.bot-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.bot-action')) {
        showPageTransition('builder.html');
      }
    });
  });

  // Handle dashboard menu navigation with transition
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const isActive = e.currentTarget.classList.contains('active');
      if (!isActive && e.currentTarget.innerText.includes('Bot Builder')) {
        showPageTransition('builder.html');
      }
    });
  });
});