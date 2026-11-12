package com.example.minecraftserver.points;

import org.bukkit.Bukkit;
import org.bukkit.event.Event;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.plugin.EventExecutor;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scheduler.BukkitTask;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.*;

public final class MinecraftServerPointsBridge extends JavaPlugin implements Listener {
  private HttpClient client;
  private BukkitTask task;
  private String baseUrl, apiKey;
  private final Set<String> busy = Collections.synchronizedSet(new HashSet<>());
  private static final Pattern ORDER = Pattern.compile("\\\"id\\\":\\\"([0-9a-fA-F-]{36})\\\".*?\\\"username\\\":\\\"([A-Za-z0-9_]{3,16})\\\".*?\\\"points\\\":([0-9]{1,5})", Pattern.DOTALL);

  @Override public void onEnable() {
    saveDefaultConfig();
    baseUrl = getConfig().getString("api-base-url", "").replaceAll("/$", "");
    apiKey = getConfig().getString("api-key", "");
    if (!baseUrl.startsWith("https://") || apiKey.length() < 32 || apiKey.startsWith("REPLACE_")) {
      getLogger().severe("Configure api-base-url and a strong api-key in plugins/MinecraftServerPointsBridge/config.yml; bridge is disabled.");
      return;
    }
    client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    long poll = Math.max(10, getConfig().getLong("poll-seconds", 15));
    task = Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::poll, 40L, poll * 20L);
    registerVoteListener();
    getLogger().info("Website order polling enabled.");
  }

  @Override public void onDisable() { if (task != null) task.cancel(); }

  private void poll() {
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/plugin/points/pending"))
          .timeout(Duration.ofSeconds(20)).header("Authorization", "Bearer " + apiKey).GET().build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) { getLogger().warning("Order queue returned HTTP " + response.statusCode()); return; }
      Matcher matcher = ORDER.matcher(response.body());
      while (matcher.find()) {
        String id = matcher.group(1), username = matcher.group(2); int points = Integer.parseInt(matcher.group(3));
        if (points < 100 || points > 50000 || points % 100 != 0 || !busy.add(id)) continue;
        Bukkit.getScheduler().runTask(this, () -> deliver(id, username, points));
      }
    } catch (Exception e) { getLogger().warning("Could not poll website order queue: " + e.getClass().getSimpleName()); }
  }

  private void deliver(String id, String username, int points) {
    try {
      // The plugin's synchronous console dispatch ensures the playerpoints command runs on the server thread.
      boolean accepted = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), "playerpoints:points give " + username + " " + points);
      if (!accepted) { report(id, false); getLogger().severe("Points command was not accepted for order " + id); return; }
      report(id, true);
    } catch (Exception e) { report(id, false); getLogger().severe("Could not deliver order " + id + ": " + e.getClass().getSimpleName()); }
    finally { busy.remove(id); }
  }

  private void report(String id, boolean success) {
    try {
      String json = "{\"success\":" + success + "}";
      HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/plugin/points/" + id + "/complete"))
          .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8)).build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) getLogger().severe("Order acknowledgement failed for " + id + " (HTTP " + response.statusCode() + ")");
    } catch (Exception e) { getLogger().severe("Order acknowledgement failed for " + id + "; staff review may be required."); }
  }

  @SuppressWarnings("unchecked")
  private void registerVoteListener() {
    if (!getConfig().getBoolean("vote-events-enabled", true)) return;
    try {
      Class<?> eventType = Class.forName("com.vexsoftware.votifier.model.VotifierEvent");
      if (!Event.class.isAssignableFrom(eventType)) throw new IllegalStateException("Unexpected Votifier event type");
      EventExecutor executor = (listener, event) -> sendVote(event);
      Bukkit.getPluginManager().registerEvent((Class<? extends Event>) eventType, this, EventPriority.MONITOR, executor, this, true);
      getLogger().info("NuVotifier event integration enabled.");
    } catch (ClassNotFoundException e) {
      getLogger().warning("NuVotifier is not installed; vote counts will not update until it is installed and configured.");
    } catch (Exception e) {
      getLogger().warning("Could not register the NuVotifier listener: " + e.getClass().getSimpleName());
    }
  }

  private void sendVote(Event event) {
    try {
      Object vote = event.getClass().getMethod("getVote").invoke(event);
      String service = String.valueOf(vote.getClass().getMethod("getServiceName").invoke(vote));
      String username = String.valueOf(vote.getClass().getMethod("getUsername").invoke(vote));
      String timestamp = String.valueOf(vote.getClass().getMethod("getTimeStamp").invoke(vote));
      String body = "{\"service\":\"" + jsonEscape(service) + "\",\"username\":\"" + jsonEscape(username) + "\",\"timestamp\":\"" + jsonEscape(timestamp) + "\"}";
      Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
        try {
          HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl + "/api/plugin/votes"))
              .timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + apiKey)
              .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8)).build();
          HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
          if (response.statusCode() != 200) getLogger().warning("Vote notification returned HTTP " + response.statusCode() + " for " + service);
        } catch (Exception e) {
          getLogger().warning("Could not send vote notification for " + service + ".");
        }
      });
    } catch (Exception e) {
      getLogger().warning("Could not read NuVotifier event: " + e.getClass().getSimpleName());
    }
  }

  private String jsonEscape(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
  }
}
