export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, message' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'fishystudioz@protonmail.com';

    if (!BREVO_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const domain = `${protocol}://${host}`;
    const headerImgUrl = `${domain}/src/fishyHeader.png`;

    // Prepare email data
    const emailData = {
      sender: {
        name: "Contact Form",
        email: "fordonthego2008@yahoo.com"
      },
      to: [
        {
          email: RECIPIENT_EMAIL,
          name: "Admin"
        }
      ],
      subject: subject || `New Contact Form Submission from ${name}`,
      htmlContent: `
        <div style="font-family: Montserrat, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f7f7; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); padding: 0 0 32px 0;">
          <div style="padding: 32px 0 0 0; text-align: center;">
            <img src="${headerImgUrl}" alt="Fishy Studioz" style="width: 160px; max-width: 60vw; filter: brightness(0);" />
          </div>
          <h2 style="color: #111; text-align: center; font-size: 2rem; font-weight: 900; margin: 24px 0 8px 0; letter-spacing: -1px;">New Contact Form Submission</h2>
          <div style="background: #fff; padding: 24px 28px; border-radius: 8px; margin: 24px 24px 0 24px; border: 1px solid #ececec;">
            <p style="margin: 0 0 12px 0; font-size: 1.1em;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0 0 12px 0; font-size: 1.1em;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0 0 12px 0; font-size: 1.1em;"><strong>Subject:</strong> ${subject || 'No subject'}</p>
            <div style="margin-top: 18px;">
              <h3 style="color: #222; margin: 0 0 8px 0; font-size: 1.1em;">Message:</h3>
              <div style="background: #f9f9f9; padding: 16px 14px; border-radius: 6px; border: 1px solid #eee; font-size: 1.05em; line-height: 1.7;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          <div style="margin: 32px 24px 0 24px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center;">
            <p style="margin: 0;">This email was sent from the Fishy Studioz website contact form.</p>
            <p style="margin: 0;">Sent at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      textContent: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject || 'No subject'}

Message:
${message}

---
This email was sent from your website contact form.
Sent at: ${new Date().toLocaleString()}
      `
    };

    // Send email via Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: errorData.message || 'Unknown error'
      });
    }

    const result = await response.json();
    
    // Success response
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}