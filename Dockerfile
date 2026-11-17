# @title: Dockerfile - the image the MCP introspection checkers build: the navego MCP stdio server starts and answers tools/list on a bare host.
# @state: navego ships as npm "navego"; the introspection path needs no browser, no display and no network beyond the registry.
# @dependencies: node:22-slim, npm registry.

FROM node:22-slim

RUN npm install --global navego@1.7.6

LABEL io.modelcontextprotocol.server.name="io.github.afnannuzulasugihartono/navego"

ENTRYPOINT ["navego", "local"]
