const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const waitlistForm = document.getElementById('waitlistForm');

    loadWaitlistCount();
    startTypingAnimation();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const church = document.getElementById('church').value.trim();

        const formData = {
            name: email.split('@')[0],
            email: email,
            church: church || null
        };

        if (!validateEmail(formData.email)) {
            showError('Please enter a valid email address');
            return;
        }

        try {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            hideError();

            const response = await fetch(`${API_URL}/waitlist/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                form.style.display = 'none';
                successMessage.style.display = 'block';

                loadWaitlistCount();

                if (window.gtag) {
                    gtag('event', 'signup', {
                        'event_category': 'waitlist',
                        'event_label': 'early_access'
                    });
                }
            } else {
                showError(data.message || 'Something went wrong. Please try again.');
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Unable to connect to server. Please try again later.');
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });

    async function loadWaitlistCount() {
        try {
            const response = await fetch(`${API_URL}/waitlist/count`);
            const data = await response.json();

            if (data.success) {
                const countElement = document.getElementById('waitlistCount');
                const countElementMobile = document.getElementById('waitlistCountMobile');
                animateCount(countElement, 0, data.count, 1000);
                if (countElementMobile) {
                    animateCount(countElementMobile, 0, data.count, 1000);
                }
            }
        } catch (error) {
            console.error('Error loading waitlist count:', error);
            document.getElementById('waitlistCount').textContent = '100+';
            const countElementMobile = document.getElementById('waitlistCountMobile');
            if (countElementMobile) {
                countElementMobile.textContent = '100+';
            }
        }
    }

    function animateCount(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = end;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showError(message) {
        errorMessage.querySelector('p').textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function startTypingAnimation() {
        const rotatingHeadline = document.getElementById('rotatingHeadline');
        const cursor = document.getElementById('headlineCursor');

        const headlines = [
            "Your Pastor Speaks. Logos Finds the Scripture.",
            "From word to screen, instantly with Logos",
            "Experience the future of Projection",
            "Real-Time Bible Verses. No More Projection Delays",
            "AI That Understands Sermons",
            "Your #1 Media Assistant for Real-Time Scripture Detection."
        ];

        let currentHeadlineIndex = 0;
        let index = 0;
        let isDeleting = false;

        function type() {
            const currentText = headlines[currentHeadlineIndex];

            if (!isDeleting && index <= currentText.length) {
                rotatingHeadline.textContent = currentText.substring(0, index);
                index++;
                setTimeout(type, 50);
            } else if (!isDeleting && index > currentText.length) {
                setTimeout(() => {
                    isDeleting = true;
                    type();
                }, 3000);
            } else if (isDeleting && index > 0) {
                index--;
                rotatingHeadline.textContent = currentText.substring(0, index);
                setTimeout(type, 30);
            } else if (isDeleting && index === 0) {
                isDeleting = false;
                currentHeadlineIndex = (currentHeadlineIndex + 1) % headlines.length;
                setTimeout(type, 500);
            }
        }

        type();
    }
});
