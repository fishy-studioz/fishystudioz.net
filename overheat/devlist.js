const cardsGrid = document.getElementById('cardsGrid');
const allSegments = [];
let profileData = [];
let isLoading = false;
let isInitialized = false;

function createPlaceholderProfile(index) {
    return {
        name: 'Loading...',
        description: 'Loading profile information...',
        image: null,
        socials: {},
        isPlaceholder: true,
        index: index
    };
}

async function loadProfileData() {
    if (isLoading) return;
    isLoading = true;

    try {

        const jsonResponse = await fetch('devlist.json');
        const localData = await jsonResponse.json();

        profileData = localData.map((profile, index) => createPlaceholderProfile(index));

        if (!isInitialized) {
            createInitialCards();
            isInitialized = true;
        }

        for (let i = 0; i < localData.length; i++) {
            const profile = localData[i];

            try {
                let updatedProfile = { ...profile };

                if (profile.uid) {
                    try {
                        const apiResponse = await fetch(`https://avatar-cyan.vercel.app/api/${profile.uid}`);
                        const apiData = await apiResponse.json();

                        updatedProfile = {
                            name: apiData.display_name || apiData.username || profile.name,
                            description: profile.description || `Discord User • ${apiData.username}#${apiData.discriminator}`,
                            image: apiData.avatarUrl || profile.image,
                            socials: profile.socials || {},
                            isPlaceholder: false,
                            index: i
                        };
                    } catch (apiError) {
                        console.error(`Error fetching API data for UID ${profile.uid}:`, apiError);

                        updatedProfile.isPlaceholder = false;
                    }
                } else {

                    updatedProfile.isPlaceholder = false;
                }

                profileData[i] = updatedProfile;

                updateProfileCard(i, updatedProfile);

            } catch (error) {
                console.error(`Error processing profile at index ${i}:`, error);

                profileData[i] = {
                    name: 'Error Loading',
                    description: 'Failed to load profile',
                    image: null,
                    socials: {},
                    isPlaceholder: false,
                    index: i
                };
                updateProfileCard(i, profileData[i]);
            }
        }

    } catch (error) {
        console.error('Error loading profile data:', error);

        if (!isInitialized) {
            profileData = [
                { 
                    name: 'Alex Chen', 
                    description: 'UI/UX Designer', 
                    image: 'images/alex.jpg',
                    socials: {
                        x: 'https://x.com/alexchen',
                        github: 'https://github.com/alexchen'
                    },
                    isPlaceholder: false,
                    index: 0
                }
            ];
            createInitialCards();
            isInitialized = true;
        }
    } finally {
        isLoading = false;
    }
}

const socialIcons = {
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>`,
    youtube: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>`,
    github: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>`,
    linkedin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>`,
    instagram: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>`,
    spotify: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>`,
    artstation: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.142-1.289H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zm-11.129-3.462L7.428 4.858l-5.444 9.428h10.887z"/>
    </svg>`,
    deviantart: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.58 0L9.824 8.171l-.696.002H0v7.654h6.844l.696.002L15.58 24H24v-8.17l-.002-.696L16.164 7.25l7.834-7.25V0z"/>
    </svg>`,
    behance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 7.5v9c0 .825.675 1.5 1.5 1.5h5.775c3.675 0 5.85-1.95 5.85-5.025S10.95 7.5 7.275 7.5zm1.8 1.5h3.975c2.4 0 3.825 1.05 3.825 2.7s-1.425 2.7-3.825 2.7H1.8zm0 7.2V14.7h4.05c2.55 0 4.125 1.125 4.125 2.925s-1.575 2.925-4.125 2.925H1.8zm14.4-7.95h7.2V6.75h-7.2zm-.75 3.75c0-2.1 1.575-3.75 3.75-3.75s3.75 1.65 3.75 3.75c0 .15 0 .3-.075.45h-6.675c.225 1.125 1.125 1.8 2.25 1.8.9 0 1.575-.375 1.95-1.05h1.875c-.525 1.725-2.025 2.85-3.9 2.85-2.175 0-3.925-1.65-3.925-3.75zm1.425-.45h4.725c-.15-1.05-.9-1.8-2.25-1.8s-2.175.75-2.475 1.8z"/>
    </svg>`,
    dribbble: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm7.568 5.302c1.4 1.5 2.252 3.5 2.273 5.698-.653-.126-2.637-.252-4.873-.126-.126-.252-.252-.505-.379-.758 2.273-.884 3.379-2.142 3.979-4.814zM12 2.179c2.389 0 4.563.884 6.231 2.331-.505 2.205-1.484 3.347-3.568 4.105C13.421 5.934 11.789 4.421 12 2.179zm-2.952 1.263C8.421 5.555 9.789 7.195 11.031 9.816c-3.063.758-5.747.758-6.357.758C5.305 7.447 7.016 4.673 9.048 3.442zM2.179 12c0-.126 0-.252.021-.379.631.021 4.336.084 7.652-.884.252.505.484 1.01.694 1.526-3.473 1.031-5.926 3.758-6.367 6.357C2.937 16.884 2.179 14.547 2.179 12zm2.568 5.705c.379-2.205 2.205-4.315 5.026-5.089.884 2.331 1.263 4.284 1.368 4.873-1.894 1.01-3.858 1.01-6.394.216zm5.515.631c-.084-.505-.379-2.205-1.2-4.441 2.016-.315 4.22.21 4.599.315-.252 1.831-1.115 3.41-2.431 4.347z"/>
    </svg>`,
    pinterest: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.083.346-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-12.014C24.007 5.36 18.641.001 12.017.001z"/>
    </svg>`,
    tiktok: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>`,
    discord: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.565 18.565 0 0 0-5.487 0 12.319 12.319 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.2 13.2 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
    </svg>`,
    twitch: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
    </svg>`,
    reddit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>`,
    mastodon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
    </svg>`,
    patreon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 .48v23.04h4.22V.48zm15.385 0c-4.764 0-8.641 3.88-8.641 8.65 0 4.755 3.877 8.623 8.641 8.623 4.75 0 8.615-3.868 8.615-8.623C24 4.36 20.136.48 15.385.48z"/>
    </svg>`,
    telegram: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>`
};

function createCardBorders(container) {
    const segments = [];

    const positions = ['top', 'bottom', 'left', 'right'];
    positions.forEach(pos => {
        const line = document.createElement('div');
        line.className = `border-line ${pos.includes('top') || pos.includes('bottom') ? 'horizontal' : 'vertical'} ${pos}`;
        container.appendChild(line);
    });

    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(corner => {
        const dot = document.createElement('div');
        dot.className = `corner-dot ${corner}`;
        container.appendChild(dot);
    });

    const measurements = [
        { text: Math.floor(Math.random() * 50 + 200), style: { top: '-20px', left: '50%', transform: 'translateX(-50%)' } },
        { text: Math.floor(Math.random() * 30 + 150), style: { bottom: '-20px', left: '50%', transform: 'translateX(-50%)' } },
        { text: Math.floor(Math.random() * 40 + 100), style: { left: '-25px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' } },
        { text: Math.floor(Math.random() * 40 + 100), style: { right: '-25px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' } }
    ];

    measurements.forEach(m => {
        const elem = document.createElement('div');
        elem.className = 'measurement';
        elem.textContent = m.text;
        Object.assign(elem.style, m.style);
        container.appendChild(elem);
    });

    const borderConfigs = [
        { side: 'top', type: 'horizontal', maxWidth: 280 },
        { side: 'bottom', type: 'horizontal', maxWidth: 280 },
        { side: 'left', type: 'vertical', maxHeight: 180 },
        { side: 'right', type: 'vertical', maxHeight: 180 }
    ];

    borderConfigs.forEach(config => {
        const numSegments = Math.floor(Math.random() * 2) + 1; 

        for (let i = 0; i < numSegments; i++) {
            const segment = document.createElement('div');
            segment.className = `border-segment ${config.type}`;

            const hasText = Math.random() > 0.7; 

            if (config.type === 'horizontal') {
                const width = Math.random() * 40 + 20; 
                segment.style.width = width + 'px';

                if (config.side === 'top') {
                    segment.style.top = '-1px';
                } else {
                    segment.style.bottom = '-1px';
                }

                const initialPos = Math.random() * (config.maxWidth - width);
                if (typeof gsap !== 'undefined') {
                    gsap.set(segment, { left: initialPos });
                } else {
                    segment.style.left = initialPos + 'px';
                }

                segments.push({
                    element: segment,
                    type: 'horizontal',
                    maxDistance: config.maxWidth - width,
                    hasText: hasText,
                    side: config.side
                });
            } else {
                const height = Math.random() * 40 + 20; 
                segment.style.height = height + 'px';

                if (config.side === 'left') {
                    segment.style.left = '-1px';
                } else {
                    segment.style.right = '-1px';
                }

                const initialPos = Math.random() * (config.maxHeight - height);
                if (typeof gsap !== 'undefined') {
                    gsap.set(segment, { top: initialPos });
                } else {
                    segment.style.top = initialPos + 'px';
                }

                segments.push({
                    element: segment,
                    type: 'vertical',
                    maxDistance: config.maxHeight - height,
                    hasText: hasText,
                    side: config.side
                });
            }

            container.appendChild(segment);
        }
    });

    return segments;
}

function animateSegments(segments) {
    if (typeof gsap === 'undefined') {
        console.warn('GSAP not loaded, skipping animations');
        return;
    }

    segments.forEach((segment, index) => {
        function createAnimation() {
            const isHorizontal = segment.type === 'horizontal';
            const maxDistance = segment.maxDistance;

            let baseDuration = Math.random() * 4 + 2; 

            if (Math.random() < 0.1) { 
                baseDuration = Math.random() * 0.8 + 0.4; 
            }

            const direction = Math.random() > 0.5 ? 1 : -1;
            const currentPos = isHorizontal ? 
                gsap.getProperty(segment.element, "left") : 
                gsap.getProperty(segment.element, "top");

            let targetPos;
            const moveDistance = Math.random() * 100 + 50; 

            if (direction > 0) {
                targetPos = Math.min(currentPos + moveDistance, maxDistance);
            } else {
                targetPos = Math.max(currentPos - moveDistance, 0);
            }

            const property = isHorizontal ? "left" : "top";

            gsap.to(segment.element, {
                [property]: targetPos,
                duration: baseDuration,
                ease: "power2.inOut",
                onUpdate: () => {
                    if (segment.hasText) {
                        const currentPos = gsap.getProperty(segment.element, property);
                        const percentage = Math.round((currentPos / maxDistance) * 100);
                        segment.element.textContent = percentage;
                    }
                },
                onComplete: () => {

                    gsap.delayedCall(Math.random() * 2 + 0.5, createAnimation);
                }
            });
        }

        if (segment.hasText) {
            const property = segment.type === 'horizontal' ? "left" : "top";
            const currentPos = gsap.getProperty(segment.element, property);
            const percentage = Math.round((currentPos / segment.maxDistance) * 100);
            segment.element.textContent = percentage;
        }

        gsap.delayedCall(Math.random() * 3, createAnimation);
    });
}

function createProfileCard(profile, index) {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';
    cardContainer.dataset.cardIndex = index;

    const card = document.createElement('div');
    card.className = 'profile-card';
    if (profile.isPlaceholder) {
        card.classList.add('loading');
    }

    const imageContainer = document.createElement('div');
    imageContainer.className = 'profile-image-container';

    const image = document.createElement('div');
    image.className = 'profile-image';

    image.style.maskImage = 'url(src/mask.png)';
    image.style.webkitMaskImage = 'url(src/mask.png)';
    image.style.maskSize = 'contain';
    image.style.webkitMaskSize = 'contain';
    image.style.maskRepeat = 'no-repeat';
    image.style.webkitMaskRepeat = 'no-repeat';
    image.style.maskPosition = 'center';
    image.style.webkitMaskPosition = 'center';

    if (profile.image && !profile.isPlaceholder) {
        image.style.backgroundImage = `url(${profile.image})`;
        image.style.backgroundSize = 'cover';
        image.style.backgroundPosition = 'center';
        image.style.backgroundRepeat = 'no-repeat';
    } else if (profile.isPlaceholder) {

        image.style.backgroundColor = '#f0f0f0';
    }

    image.style.aspectRatio = '1';
    image.style.width = '100px';
    image.style.height = '100px';

    imageContainer.appendChild(image);
    card.appendChild(imageContainer);

    const name = document.createElement('div');
    name.className = 'profile-name';
    name.textContent = profile.name;
    card.appendChild(name);

    const description = document.createElement('div');
    description.className = 'profile-description';
    description.textContent = profile.description;
    card.appendChild(description);

    if (profile.socials && Object.keys(profile.socials).length > 0 && !profile.isPlaceholder) {
        const socialContainer = document.createElement('div');
        socialContainer.className = 'social-links';

        Object.entries(profile.socials).forEach(([platform, url]) => {
            if (url && url.trim() !== '') {
                const link = document.createElement('a');
                link.className = `social-link ${platform}`;
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.innerHTML = socialIcons[platform] || platform;
                link.onclick = (e) => {
                    console.log(`Opening ${platform} for ${profile.name}: ${url}`);
                };
                socialContainer.appendChild(link);
            }
        });

        if (socialContainer.children.length > 0) {
            card.appendChild(socialContainer);
        }
    }

    cardContainer.appendChild(card);

    const segments = createCardBorders(cardContainer);
    allSegments.push(...segments);

    return cardContainer;
}

function updateProfileCard(index, profile) {
    const cardContainer = document.querySelector(`[data-card-index="${index}"]`);
    if (!cardContainer) return;

    const card = cardContainer.querySelector('.profile-card');
    const image = card.querySelector('.profile-image');
    const name = card.querySelector('.profile-name');
    const description = card.querySelector('.profile-description');

    card.classList.remove('loading');

    if (profile.image) {
        image.style.backgroundImage = `url(${profile.image})`;
        image.style.backgroundSize = 'cover';
        image.style.backgroundPosition = 'center';
        image.style.backgroundRepeat = 'no-repeat';
        image.style.backgroundColor = '';
    }

    name.textContent = profile.name;
    description.textContent = profile.description;

    const existingSocialContainer = card.querySelector('.social-links');
    if (existingSocialContainer) {
        existingSocialContainer.remove();
    }

    if (profile.socials && Object.keys(profile.socials).length > 0) {
        const socialContainer = document.createElement('div');
        socialContainer.className = 'social-links';

        Object.entries(profile.socials).forEach(([platform, url]) => {
            if (url && url.trim() !== '') {
                const link = document.createElement('a');
                link.className = `social-link ${platform}`;
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.innerHTML = socialIcons[platform] || platform;
                link.onclick = (e) => {
                    console.log(`Opening ${platform} for ${profile.name}: ${url}`);
                };
                socialContainer.appendChild(link);
            }
        });

        if (socialContainer.children.length > 0) {
            card.appendChild(socialContainer);
        }
    }
}

function createInitialCards() {

    cardsGrid.innerHTML = '';
    allSegments.length = 0;

    profileData.forEach((profile, index) => {
        const cardElement = createProfileCard(profile, index);
        cardsGrid.appendChild(cardElement);
    });

    animateSegments(allSegments);
}

async function init() {
    if (isInitialized) return;

    await loadProfileData();
}

function handleResize() {

    if (window.innerWidth !== handleResize.lastWidth) {
        handleResize.lastWidth = window.innerWidth;

        if (typeof gsap !== 'undefined') {
            allSegments.forEach(segment => {
                gsap.killTweensOf(segment.element);
            });
            animateSegments(allSegments);
        }
    }
}

handleResize.lastWidth = window.innerWidth;

window.addEventListener('load', init);
window.addEventListener('resize', handleResize);