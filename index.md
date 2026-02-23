---
layout: default
---

<div class="hero">
  <h1>OpenCanvas Tech</h1>
  <p>Engineering insights, product thinking, and practical execution.</p>
  <a href="#newsletter" class="button">Join the Newsletter</a>
</div>

<h2 id="newsletter">Join the Newsletter</h2>

<div class="newsletter-embed">
  <iframe 
    src="https://docs.google.com/forms/d/e/1FAIpQLSevbtkHnCDa3zA5cQBt3g8grVAOQ-HVXZgokBslLvvjImHCYQ/viewform?embedded=true&?hl=en"
    width="100%" 
    height="520" 
    frameborder="0">
  </iframe>
</div>

## Latest Articles

{% for post in site.posts limit:5 %}
- [{{ post.title }}]({{ post.url }}) — {{ post.date | date: "%B %d, %Y" }}
{% endfor %}
