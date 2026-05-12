import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | TuckInn Proper - Fresh Lunch, Fast Ordering",
  description: "Healthy eating tips, lunch ideas, catering guides, and insider food knowledge from TuckInn Proper. Your source for fresh lunch inspiration.",
  keywords: ["food blog", "healthy lunch", "lunch ideas", "catering tips", "restaurant news"]
};

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readingTime: number;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const postsDirectory = path.join(process.cwd(), "app/blog/posts");
  
  try {
    const files = await fs.readdir(postsDirectory);
    const mdxFiles = files.filter(file => file.endsWith(".md"));
    
    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const slug = file.replace(".md", "");
        const filePath = path.join(postsDirectory, file);
        const content = await fs.readFile(filePath, "utf-8");
        
        // Extract frontmatter
        const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";
        
        const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
        const dateMatch = frontmatter.match(/date:\s*"([^"]+)"/);
        const excerptMatch = frontmatter.match(/excerpt:\s*"([^"]+)"/);
        const readingMatch = frontmatter.match(/readingTime:\s*(\d+)/);
        
        return {
          slug,
          title: titleMatch ? titleMatch[1] : slug,
          date: dateMatch ? dateMatch[1] : new Date().toISOString(),
          excerpt: excerptMatch ? excerptMatch[1] : "",
          readingTime: readingMatch ? parseInt(readingMatch[1]) : 5
        };
      })
    );
    
    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error reading blog posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  
  return (
    <div className="blog-page">
      <header className="blog-header">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol itemScope itemType="https://schema.org/BreadcrumbList">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" itemProp="item" className="breadcrumb-link">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="breadcrumb-current">Blog</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>
        
        <h1 className="blog-title">Fresh Lunch Insights</h1>
        <p className="blog-description">
          Healthy eating tips, catering guides, and insider food knowledge from the TuckInn Proper team.
          Your source for lunch inspiration.
        </p>
      </header>
      
      <section className="blog-posts">
        <h2 className="sr-only">Latest Articles</h2>
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <Link href={`/blog/${post.slug}`} className="blog-card-link">
                <div className="blog-card-content">
                  <time className="blog-date" dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </time>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <footer className="blog-card-footer">
                    <span className="reading-time">{post.readingTime} min read</span>
                    <span className="read-more">Read More →</span>
                  </footer>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
