document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedback-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  const successScreen = document.getElementById('success-screen');
  const generatedIdSpan = document.getElementById('generated-id');
  const copyBtn = document.getElementById('copy-id-btn');
  const copyToast = document.getElementById('copy-toast');
  const newFeedbackBtn = document.getElementById('new-feedback-btn');

  // Input Fields
  const inputs = {
    name: {
      element: document.getElementById('name'),
      group: document.getElementById('name').closest('.input-group'),
      validate() {
        return this.element.value.trim() !== '';
      }
    },
    email: {
      element: document.getElementById('email'),
      group: document.getElementById('email').closest('.input-group'),
      validate() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.element.value.trim());
      }
    },
    feedback: {
      element: document.getElementById('feedback'),
      group: document.getElementById('feedback').closest('.input-group'),
      validate() {
        return this.element.value.trim() !== '';
      }
    }
  };

  // Real-time input validation & cleanup
  Object.keys(inputs).forEach(key => {
    const field = inputs[key];
    
    // Clear invalid state on input change
    field.element.addEventListener('input', () => {
      if (field.group.classList.contains('invalid')) {
        if (field.validate()) {
          field.group.classList.remove('invalid');
        }
      }
    });

    // Validate on blur for better UX
    field.element.addEventListener('blur', () => {
      if (!field.validate() && field.element.value.trim() !== '') {
        field.group.classList.add('invalid');
      } else if (field.validate()) {
        field.group.classList.remove('invalid');
      }
    });
  });

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields first
    let isFormValid = true;
    Object.keys(inputs).forEach(key => {
      const field = inputs[key];
      if (!field.validate()) {
        field.group.classList.add('invalid');
        isFormValid = false;
      } else {
        field.group.classList.remove('invalid');
      }
    });

    if (!isFormValid) {
      // Shake animation for the card to indicate error
      const card = document.getElementById('feedback-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
      return;
    }

    // Set loading state
    setLoading(true);

    const payload = {
      name: inputs.name.element.value.trim(),
      email: inputs.email.element.value.trim(),
      feedback: inputs.feedback.element.value.trim()
    };

    try {
      const response = await fetch('https://feedback-app-syedrahmi.onrender.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success flow
        generatedIdSpan.textContent = result.id;
        showSuccessState(true);
      } else {
        // API Error
        alert(result.error || 'Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('A network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  // Copy Feedback ID to Clipboard
  copyBtn.addEventListener('click', () => {
    const textToCopy = generatedIdSpan.textContent;
    
    // Copy API fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(showToast).catch(console.error);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed'; // prevent scrolling
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast();
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textarea);
    }
  });

  // Reset Form for New Feedback
  newFeedbackBtn.addEventListener('click', () => {
    form.reset();
    showSuccessState(false);
  });

  // Helper: Toast visual indicator
  function showToast() {
    copyToast.classList.add('show');
    // Change icon to solid/check briefly
    const icon = copyBtn.querySelector('i');
    icon.className = 'fa-solid fa-check';
    icon.style.color = 'var(--color-success)';

    setTimeout(() => {
      copyToast.classList.remove('show');
      icon.className = 'fa-regular fa-copy';
      icon.style.color = '';
    }, 2000);
  }

  // Helper: Toggle Loading UI
  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.classList.add('hidden');
      btnLoader.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  }

  // Helper: Switch between Form and Success views
  function showSuccessState(isSuccess) {
    if (isSuccess) {
      form.classList.add('hidden');
      successScreen.classList.remove('hidden');
      
      // Update header
      document.getElementById('app-title').textContent = 'Submission Sent';
      document.getElementById('app-subtitle').textContent = 'Thank you for sharing your thoughts with us!';
    } else {
      form.classList.remove('hidden');
      successScreen.classList.add('hidden');
      
      // Reset header
      document.getElementById('app-title').textContent = 'Send Feedback';
      document.getElementById('app-subtitle').textContent = 'We would love to hear your thoughts, suggestions, or concerns.';
    }
  }
});
