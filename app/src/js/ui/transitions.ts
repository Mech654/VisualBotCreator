export function showPageTransition(destination: string): void {
  let pageTransition = document.querySelector('.page-transition') as HTMLElement;
  if (!pageTransition) {
    pageTransition = document.createElement('div');
    pageTransition.className = 'page-transition';

    const icon = document.createElement('span');
    icon.className = 'transition-icon';
    icon.textContent = '🤖';

    pageTransition.appendChild(icon);
    pageTransition.appendChild(document.createTextNode('Loading...'));

    document.body.appendChild(pageTransition);

    if (!document.getElementById('transition-styles')) {
      const style = document.createElement('style');
      style.id = 'transition-styles';
      style.textContent = `
        .page-transition {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--dark);
          z-index: 9999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.4s;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        
        .page-transition.active {
          opacity: 0.9;
          visibility: visible;
        }
        
        .transition-icon {
          font-size: 48px;
          margin-right: 15px;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  pageTransition.classList.add('active');

  setTimeout(() => {
    window.location.href = destination;
  }, 400);
}
