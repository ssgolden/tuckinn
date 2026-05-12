import { notFound } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { Metadata } from "next";

interface BlogPostFrontmatter {
  title: string;
  slug: string;
  date: string;
  author: string;
  excerpt: string;
  keywords: string[];
  readingTime: number;
}

interface BlogPost extends BlogPostFrontmatter {
  content: string;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(process.cwd(), "app/blog/posts", `${slug}.md`);
    const content = await fs.readFile(filePath, "utf-8");
    
    const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
    const bodyContent = content.replace(/---\n[\s\S]*?\n---/, "").trim();
    
    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
    const dateMatch = frontmatter.match(/date:\s*"([^"]+)"/);
    const authorMatch = frontmatter.match(/author:\s*"([^"]+)"/);
    const excerptMatch = frontmatter.match(/excerpt:\s*"([^"]+)"/);
    const keywordsMatch = frontmatter.match(/keywords:\s*\[([^\]]+)\]/);
    const readingMatch = frontmatter.match(/readingTime:\s*(\d+)/);
    
    return {
      title: titleMatch ? titleMatch[1] : slug,
      slug,
      date: dateMatch ? dateMatch[1] : new Date().toISOString(),
      author: authorMatch ? authorMatch[1] : "TuckInn Team",
      excerpt: excerptMatch ? excerptMatch[1] : "",
      keywords: keywordsMatch 
        ? keywordsMatch[1].split(",").map(k => k.replace(/"/g, '').trim())
        : [],
      readingTime: readingMatch ? parseInt(readingMatch[1]) : 5,
      content: bodyContent
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    return {
      title: "Post Not Found | TuckInn Proper"
    };
  }
  
  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.keywords,
    alternates: {
      canonical: `https://tuckinnproper.com/blog/${post.slug}`
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://tuckinnproper.com/blog/${post.slug}`,
      type: 'article',
      images: [{ url: "https://tuckinnproper.com/og-image.jpg" }]
    }
  };
}

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), "app/blog/posts");
  
  try {
    const files = await fs.readdir(postsDirectory);
    return files
      .filter(file => file.endsWith(".md"))
      .map(file => ({ slug: file.replace(".md", "") }));
  } catch {
    return [];
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    notFound();
  }
  
  const contentHtml = post.content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="blog-link">$1</a>')
    .replace(/\n\n/g, '</p><p>');
  
  return (
    <article className="blog-post">
      <header className="blog-post-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" itemProp="item" className="breadcrumb-link">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/blog" itemProp="item" className="breadcrumb-link">
                <span itemProp="name">Blog</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="breadcrumb-current">{post.title}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>
        
        <time className="blog-date" dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </time>
        
        <h1 className="blog-post-title">{post.title}</h1>
        
        <div className="blog-meta">
          <span className="blog-author">By {post.author}</span>
          <span className="blog-reading-time">{post.readingTime} min read</span>
        </div>
      </header>
      
      <div 
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      
      <footer className="blog-post-footer">
        <div className="blog-cta">
          <h3>Ready to Order Fresh Lunch?</h3>
          <p>Experience the difference fresh makes with TuckInn Proper.</p>
          <Link href="/menu" className="cta-button">
            Browse Our Menu
          </Link>
        </div>
        
        <nav className="blog-navigation">
          <Link href="/blog" className="back-to-blog">
            ← Back to Blog
          </Link>
        </nav>
      </footer>
    </article>
  );
}
