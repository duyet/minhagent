import ask_user from "./ask_user"
import execute_snippet from "./execute_snippet"
import get_time from "./get_time"
import get_weather from "./get_weather"
import github_repo from "./github_repo"
import mcp_call from "./mcp_call"
import mcp_list_tools from "./mcp_list_tools"
import scrape_page from "./scrape_page"

/** Filename = tool name, same as Eve discovery. */
export const agentTools = {
  github_repo,
  ask_user,
  get_time,
  get_weather,
  scrape_page,
  execute_snippet,
  mcp_list_tools,
  mcp_call,
}
