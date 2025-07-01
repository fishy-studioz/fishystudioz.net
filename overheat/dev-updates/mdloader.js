class BlogLoader {
  constructor() {
    this.blogData = [];
    this.init();
  }

  async init() {
    await this.loadBlogData();
    this.setupMarkdownRenderer();
    this.renderBlogEntries();
    this.setupEventListeners();
    this.setupLightbox();
  }

  async loadBlogData() {
    try {
      const response = await fetch('infoupdates.json');
      this.blogData = await response.json();
    } catch (error) {
      console.error('Error loading blog data:', error);
      this.blogData = [
        {
          smallTitle: "Fallback Entry",
          bigTitle: "Failed to load JSON",
          imageSource: "localSRC/fallback.jpg",
          content: [
            "# Demo Content",
            "Could not load external blog data.",
            "![Alt text|center|medium|Example image](https://picsum.photos/400)",
            "[video|center|medium](https://www.youtube.com/embed/dQw4w9WgXcQ)",
            "## Gallery Example",
            "{{gallery-start}}",
            "![Gallery 1|small|First image](https://picsum.photos/300/200)",
            "![Gallery 2|small|Second image](https://picsum.photos/300/201)",
            "![Gallery 3|small|Third image](https://picsum.photos/300/202)",
            "{{gallery-end}}"
          ]
        }
      ];
    }
  }

  setupMarkdownRenderer() {
    this.cleanupInterface();

    // Preprocess custom gallery and video tags
    const preprocessCustomTags = (markdown) => {
      // Handle gallery sections
      markdown = markdown.replace(
        /\{\{gallery-start\}\}([\s\S]*?)\{\{gallery-end\}\}/g,
        (match, content) => {
          return `<div class="image-gallery">${content}</div>`;
        }
      );

      // Handle legacy image syntax {{image}}...{{/image}}
      markdown = markdown.replace(
        /\{\{image(?:-(left|right|center))?\}\}\s*(https?:\/\/[^\s]+)\s*(.*?)\s*\{\{\/image(?:-\1)?\}\}/g,
        (match, align = 'center', url, caption) => {
          const alignment = align || 'center';
          const size = 'medium'; // default size for legacy syntax
          return `![${caption}|${alignment}|${size}|${caption}](${url})`;
        }
      );

      // Handle video center tags
      markdown = markdown.replace(
        /\{\{video-center\}\}([\s\S]*?)\{\{\/video-center\}\}/g,
        (match, url) => {
          return `[video|center|medium](${url.trim()})`;
        }
      );

      return markdown;
    };

    // Configure marked with custom renderers
    marked.use({
      renderer: {
        image(href, title, text) {
          // Parse text format: "Alt text|position|size|caption"
          const parts = text ? text.split("|").map(s => s.trim()) : [];
          const [alt = "", position = "center", size = "medium", caption = ""] = parts;

          // Validate position and size
          const validPositions = ['left', 'right', 'center', 'full'];
          const validSizes = ['small', 'medium', 'large', 'full'];
          
          const finalPosition = validPositions.includes(position) ? position : 'center';
          const finalSize = validSizes.includes(size) ? size : 'medium';

          // Create container classes
          const containerClasses = ['image-container'];
          if (finalPosition !== 'center') {
            containerClasses.push(`image-${finalPosition}`);
          }
          if (finalSize !== 'medium') {
            containerClasses.push(`image-${finalSize}`);
          }

          // Caption HTML
          const captionHTML = caption ? `<div class="image-caption">${caption}</div>` : "";

          // Create the image HTML with lightbox support
          const imageHTML = `
            <div class="${containerClasses.join(' ')}">
              <img src="${href}" alt="${alt}" class="lightbox-trigger" data-lightbox="${href}">
              ${captionHTML}
            </div>
            ${finalPosition === 'left' || finalPosition === 'right' ? '' : '<div class="clear"></div>'}
          `;

          return imageHTML;
        },

        link(href, title, text) {
          // Handle video links with format [video|position|size]
          if (text && text.startsWith("video|")) {
            const parts = text.split("|").map(s => s.trim());
            const [, position = "center", size = "medium"] = parts;

            // Validate position and size
            const validPositions = ['left', 'right', 'center', 'full'];
            const validSizes = ['small', 'medium', 'large', 'full'];
            
            const finalPosition = validPositions.includes(position) ? position : 'center';
            const finalSize = validSizes.includes(size) ? size : 'medium';

            // Create container classes
            const containerClasses = ['video-container'];
            if (finalPosition !== 'center') {
              containerClasses.push(`video-${finalPosition}`);
            }
            if (finalSize !== 'medium') {
              containerClasses.push(`video-${finalSize}`);
            }

            // Determine if it's an iframe or video element
            const isYouTube = href.includes("youtube.com") || href.includes("youtu.be");
            const isVimeo = href.includes("vimeo.com");
            const isIframe = isYouTube || isVimeo;

            let videoHTML;
            if (isIframe) {
              // Convert YouTube watch URLs to embed URLs
              let embedUrl = href;
              if (href.includes("youtube.com/watch?v=")) {
                const videoId = href.split("v=")[1].split("&")[0];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              } else if (href.includes("youtu.be/")) {
                const videoId = href.split("youtu.be/")[1];
                embedUrl = `https://www.youtube.com/embed/${videoId}`;
              }

              videoHTML = `
                <div class="${containerClasses.join(' ')}">
                  <div class="responsive-iframe">
                    <iframe src="${embedUrl}" frameborder="0" allowfullscreen loading="lazy"></iframe>
                  </div>
                </div>
              `;
            } else {
              videoHTML = `
                <div class="${containerClasses.join(' ')}">
                  <video controls preload="metadata">
                    <source src="${href}" type="video/mp4">
                    Your browser does not support the video tag.
                  </video>
                </div>
              `;
            }

            return videoHTML + (finalPosition === 'left' || finalPosition === 'right' ? '' : '<div class="clear"></div>');
          }

          // Regular link handling
          const external = href.startsWith('http') && !href.includes(window.location.hostname);
          const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `<a href="${href}"${title ? ` title="${title}"` : ''}${target}>${text}</a>`;
        },

        // Enhanced blockquote with better styling
        blockquote(quote) {
          return `<blockquote>${quote}</blockquote>`;
        },

        // Enhanced code block handling
        code(code, language) {
          const lang = language || 'text';
          return `<pre><code class="language-${lang}">${code}</code></pre>`;
        }
      }
    });

    // Make parseMarkdown globally available
    window.parseMarkdown = (text) => {
      if (!text) return '';
      
      // Preprocess custom tags
      text = preprocessCustomTags(text);
      
      // Parse with marked
      const html = marked.parse(text);
      
      return html;
    };
  }

  setupLightbox() {
    // Create lightbox if it doesn't exist
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox';
      lightbox.className = 'lightbox';
      lightbox.innerHTML = `
        <button class="lightbox-close">&times;</button>
        <img src="" alt="">
      `;
      document.body.appendChild(lightbox);
    }

    // Setup lightbox event listeners
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox-trigger')) {
        e.preventDefault();
        const src = e.target.dataset.lightbox || e.target.src;
        const alt = e.target.alt || '';
        
        const lightboxImg = lightbox.querySelector('img');
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        
        lightbox.style.display = 'flex';
      }
    });

    // Close lightbox
    const closeLightbox = () => {
      const lightbox = document.getElementById('lightbox');
      if (lightbox) lightbox.style.display = 'none';
    };

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('lightbox-close') || e.target.id === 'lightbox') {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'flex') {
          closeLightbox();
        } else {
          this.closeOverlay();
        }
      }
    });
  }

  cleanupInterface() {
    const elementsToHide = [
      '.demo-content .btn',
      '.syntax-examples',
      'textarea',
      '.demo-content h2:last-of-type',
      '.demo-content p:last-of-type'
    ];

    elementsToHide.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => el.style.display = 'none');
    });

    const mainTitle = document.querySelector('.demo-content h1');
    if (mainTitle) mainTitle.textContent = 'Blog Post Viewer';

    const demoContent = document.querySelector('.demo-content');
    if (demoContent) {
      [...demoContent.children].forEach((child, i) => {
        if (i !== 0 && child.tagName !== 'H1') child.style.display = 'none';
      });
    }
  }

  renderBlogEntries() {
    const container = document.querySelector('.blogContainer');
    if (!container) return console.error('Missing blog container');

    container.querySelectorAll('.slectionBlog').forEach(e => e.remove());

    this.blogData.forEach((blog, index) => {
      const blogElem = this.createBlogElement(blog, index);
      container.appendChild(blogElem);
    });
  }

  createBlogElement(blog, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'slectionBlog';

    const bloghref = document.createElement('div');
    bloghref.className = index % 2 ? 'bloghref reverse' : 'bloghref';
    bloghref.dataset.blogIndex = index;

    const img = document.createElement('img');
    img.className = 'hexagon';
    img.src = blog.imageSource;
    img.alt = `Blog ${index + 1}`;
    img.loading = 'lazy';

    const content = document.createElement('div');
    content.className = 'trailContent';

    const h2 = document.createElement('h2');
    h2.className = 'initHeading';
    h2.textContent = blog.smallTitle;

    const h1 = document.createElement('h1');
    h1.className = 'Heading';
    h1.textContent = blog.bigTitle;

    content.append(h2, h1);
    bloghref.append(img, content);
    wrapper.appendChild(bloghref);
    return wrapper;
  }

  setupEventListeners() {
    // Blog entry click handler
    document.addEventListener('click', e => {
      const blog = e.target.closest('.bloghref');
      if (blog) {
        e.preventDefault();
        this.loadBlogContent(parseInt(blog.dataset.blogIndex));
      }
    });

    this.setupModalListeners();
  }

  setupModalListeners() {
    const overlay = document.getElementById('overlay');
    
    // Overlay click to close
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) this.closeOverlay();
      });
    }

    // Close button handler
    const closeBtn = document.querySelector('.close-btn, .closeOverlay');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeOverlay();
      });
    }

    // Escape key handler
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'flex') {
          lightbox.style.display = 'none';
        } else {
          this.closeOverlay();
        }
      }
    });
  }

  loadBlogContent(index) {
    const blog = this.blogData[index];
    if (!blog) return console.error('Invalid blog index');

    // Handle both array and string content
    const rawMarkdown = Array.isArray(blog.content)
      ? blog.content.join('\n')
      : blog.content;

    const output = document.getElementById('markdown-output');
    if (output && typeof parseMarkdown === 'function') {
      output.innerHTML = parseMarkdown(rawMarkdown);
      
      // Highlight code blocks if Prism is available
      if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(output);
      }
      
      // Setup lightbox for newly rendered images
      this.setupImageLightbox(output);
    }

    this.showOverlay();
  }

  setupImageLightbox(container) {
    // Add lightbox triggers to images that don't have them
    const images = container.querySelectorAll('img:not(.lightbox-trigger)');
    images.forEach(img => {
      img.classList.add('lightbox-trigger');
      img.dataset.lightbox = img.src;
      img.style.cursor = 'pointer';
    });
  }

  showOverlay() {
    const overlay = document.getElementById('overlay');
    const mainContent = document.querySelector('.main-content');
    
    if (overlay) overlay.classList.add('active');
    if (mainContent) mainContent.classList.add('blur-background');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closeOverlay() {
    const overlay = document.getElementById('overlay');
    const mainContent = document.querySelector('.main-content');
    
    if (overlay) overlay.classList.remove('active');
    if (mainContent) mainContent.classList.remove('blur-background');
    
    // Restore body scroll
    document.body.style.overflow = '';
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BlogLoader();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogLoader;
}