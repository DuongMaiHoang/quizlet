# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Q Quizlet Clone" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e5]: Q
        - generic [ref=e6]: Quizlet Clone
      - navigation [ref=e7]:
        - link "Create Set" [ref=e8] [cursor=pointer]:
          - /url: /sets/new
          - img [ref=e9]
          - generic [ref=e10]: Create Set
  - main [ref=e11]:
    - generic [ref=e12]:
      - img [ref=e14]
      - heading "Something went wrong" [level=3] [ref=e16]
      - paragraph [ref=e17]: Invalid time value
      - link "Go Home" [ref=e19] [cursor=pointer]:
        - /url: /
  - button "Open Next.js Dev Tools" [ref=e25] [cursor=pointer]:
    - img [ref=e26]
  - alert [ref=e29]
```