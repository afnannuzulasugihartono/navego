# @title: Dockerfile - the image the MCP introspection checkers build: the opera MCP stdio server starts and answers tools/list on a bare host.
# @state: opera ships as npm "opera"; the introspection path needs no browser, no display and no network beyond the registry.
# @dependencies: node:22-slim, npm registry.

FROM node:22-slim

RUN npm install --global opera@1.7.6 --ignore-scripts

RUN groupadd --system opera && useradd --system --gid opera --create-home opera
USER opera

LABEL io.modelcontextprotocol.server.name="io.github.afnannuzulasugihartono/opera"

ENTRYPOINT ["opera", "local"]
