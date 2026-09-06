// Google Identity Services (GIS) Client Helper

let gisLoadedPromise = null;

export const loadGoogleScript = () => {
  if (gisLoadedPromise) return gisLoadedPromise;

  gisLoadedPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Google Identity Services script failed to load.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google script.'));
    document.head.appendChild(script);
  });

  return gisLoadedPromise;
};

export const promptGoogleSignIn = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  // If Client ID is not configured, generate a client-side dev Google token for testing
  if (!clientId || clientId === 'mock-google-client-id') {
    const devEmail = window.prompt('Enter your Google email to test Google Sign-In:', 'user@gmail.com');
    if (!devEmail) {
      throw new Error('Google sign-in was cancelled or failed.');
    }
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'google_sub_' + Date.now(),
      email: devEmail,
      email_verified: true,
      given_name: devEmail.split('@')[0],
      family_name: 'User',
      picture: 'https://lh3.googleusercontent.com/a/default-user'
    }));
    return `${header}.${payload}.signature_mock`;
  }

  const googleId = await loadGoogleScript();

  return new Promise((resolve, reject) => {
    try {
      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Google sign-in was cancelled or failed.'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleId.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isDismissedMoment()) {
          console.warn('[Google GIS] Prompt notification state:', notification.getNotDisplayedReason?.() || notification.getDismissedReason?.());
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
