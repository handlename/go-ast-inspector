<script lang="ts">
import { APP_NAME } from '$lib/utils/constants';

const VERSION = '0.2.2';
const REPOSITORY_URL = 'https://github.com/handlename/go-ast-inspector';
const AUTHOR_URL = 'https://github.com/handlename';
</script>

<header class="header-bar">
    <div class="header-bar__main">
        <div class="header-bar__title-section">
            <h1 class="header-bar__title">{APP_NAME}</h1>
            <p class="header-bar__subtitle">
                Visualize Go Abstract Syntax Tree
            </p>
        </div>
        <div class="header-bar__meta">
            <span class="header-bar__version">v{VERSION}</span>
            <a
                href={REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="header-bar__link"
                aria-label="GitHub Repository"
            >
                Repository
            </a>
            <a
                href={AUTHOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                class="header-bar__link"
                aria-label="Author GitHub Profile"
            >
                @handlename
            </a>
        </div>
    </div>
</header>

<style>
    .header-bar {
        background-color: #2c3e50;
        color: white;
        padding: 1rem 2rem;
        border-bottom: 2px solid #34495e;
    }

    .header-bar__main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
    }

    .header-bar__title-section {
        flex: 1;
    }

    .header-bar__title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .header-bar__subtitle {
        margin: 0.25rem 0 0 0;
        font-size: 0.875rem;
        color: #ecf0f1;
        opacity: 0.9;
    }

    .header-bar__meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.875rem;
    }

    .header-bar__version {
        color: #ecf0f1;
        opacity: 0.8;
        font-weight: 500;
    }

    .header-bar__link {
        color: #3498db;
        text-decoration: none;
        transition: color 0.2s;
    }

    .header-bar__link:hover {
        color: #5dade2;
        text-decoration: underline;
    }

    .header-bar__link:focus {
        outline: 2px solid #3498db;
        outline-offset: 2px;
    }

    @media (max-width: 768px) {
        .header-bar__main {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .header-bar__meta {
            flex-wrap: wrap;
            gap: 0.75rem;
        }
    }
</style>
