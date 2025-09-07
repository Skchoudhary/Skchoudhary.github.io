---
layout: home
---

## About Me

I am a Full Stack Engineer at MotoInsight, working remotely to build comprehensive web solutions. I hold a degree from Amritsar College of Engineering and Technology.

My professional focus centers on developing scalable web applications and CRM systems, with particular expertise in Django and full-stack development. I specialize in creating robust solutions that seamlessly integrate frontend user experiences with powerful backend architectures.

In addition to my primary role, I provide consultancy and freelance services, helping businesses build custom CRM solutions and web applications. My approach emphasizes creating efficient, maintainable systems that drive business growth and improve operational workflows.

Beyond my technical work, I maintain an active lifestyle through trekking, express creativity through sketching, and am currently exploring Large Language Models (LLMs) and their practical applications. I also enjoy [reading books](reading-list.html) and sharing knowledge through various technical and personal blogs.

---

## Navigation

- **[Projects](projects.html)** - View my technical projects and contributions
- **[Reading Lists](reading-list.html)** - Books I've read and recommend
  - [General Books](reading-list.html)
  - [Technical Books](reading-list-technical.html)

---

## Latest Blog Posts
<div id="latest-posts">Loading latest posts from my blog...</div>

<script>
async function fetchLatestPosts() {
    try {
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://blogs.dgplug.org/sandeepk/feed/');
        const data = await response.json();

        if (data.status === 'ok' && data.items) {
            const postsContainer = document.getElementById('latest-posts');
            const posts = data.items.slice(0, 5); // Show latest 5 posts

            let postsHTML = '<ul>';
            posts.forEach(post => {
                const date = new Date(post.pubDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                postsHTML += `<li><a href="${post.link}" target="_blank">${post.title}</a> <em>(${date})</em></li>`;
            });
            postsHTML += '</ul>';
            postsHTML += '<p><a href="https://blogs.dgplug.org/sandeepk/" target="_blank">View all posts →</a></p>';

            postsContainer.innerHTML = postsHTML;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        document.getElementById('latest-posts').innerHTML =
            '<p><a href="https://blogs.dgplug.org/sandeepk/" target="_blank">Visit my blog →</a></p>';
    }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', fetchLatestPosts);
</script>

---

## Contact

- **E-mail:** sandeepchoudhary1507[AT]gmail[DOT]com
- **LinkedIn:** [linkedin.com/in/sandeepk15](https://www.linkedin.com/in/sandeepk15/)
- **Keep in touch:** [twitter](https://twitter.com/sandeepk__), [freenode](irc://irc.freenode.net/sandeepk,isnick), [rss feed](https://blogs.dgplug.org/sandeepk/feed/)
- **GitHub:** [github.com/skchoudhary](https://github.com/skchoudhary/)

- ~~story~~
