(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()

document.querySelectorAll('[data-password-toggle="button"]').forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.getAttribute('data-target-id')
    const passwordInput = document.getElementById(targetId)

    if (!passwordInput) {
      return
    }

    const isHidden = passwordInput.type === 'password'
    passwordInput.type = isHidden ? 'text' : 'password'
    button.textContent = isHidden ? 'Hide' : 'Show'
    button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password')
  })
})