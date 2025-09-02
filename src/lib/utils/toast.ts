// 簡單的 toast 通知系統
// 在實際應用中應該使用 react-hot-toast 或 sonner

class Toast {
  private container: HTMLElement | null = null;

  private createContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const container = this.createContainer();
    const toast = document.createElement('div');
    
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };

    toast.className = `${colors[type]} text-white px-4 py-2 rounded-md shadow-lg mb-2 pointer-events-auto transition-all duration-300 transform translate-x-full`;
    toast.textContent = message;

    container.appendChild(toast);

    // 動畫進入
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);

    // 自動消失
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  success(message: string) {
    this.showToast(message, 'success');
  }

  error(message: string) {
    this.showToast(message, 'error');
  }

  info(message: string) {
    this.showToast(message, 'info');
  }
}

export const toast = new Toast();