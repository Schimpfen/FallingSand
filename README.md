Projektbeschreibung – Fließsand-Zellulärer Automat

Dieses Projekt untersucht das Verhalten unterschiedlicher Sandkörnungen auf einer Oberfläche mithilfe eines einfachen zellulären Automaten. Ausgangspunkt ist eine Fragestellung aus der Betontechnik: In der Realität versucht man, verschiedenste Sandformen und -größen im Material zu nutzen, doch sehr runde oder sehr feine Körner verrieseln und bilden Klumpen, was die gewünschte Oberflächenstruktur verhindert.

 Das Modell abstrahiert diese physikalischen Effekte, indem es zwei Körnungstypen simuliert:

Runde Körner, die leichter rollen und weniger stabil liegen

Eckige Körner, die sich eher verhaken, schwerer verrutschen und lokalere Strukturen bilden

 Die Körner interagieren mit einer definierten Oberfläche bzw. Topologie. Zunächst existiert eine ebene, glatte Fläche, auf die Sand Schritt für Schritt aufgebracht wird. Systematisch entsteht dadurch ein simuliertes „Aufschütten“ des Materials.

 Statt komplexer Messmethoden wie realen Schüttwinkeln konzentriert sich das Modell auf eine einfache Messgröße: die Differenz zwischen dem höchsten und dem tiefsten Punkt der Schüttung. Dadurch lassen sich direkte Aussagen über Verrieselung, Haufenstabilität und Klumpungsneigung treffen.

 Das Verhalten wird durch einfache lokale Update-Regeln gesteuert. In einer Art „Agentenmodus“ übernimmt jedes Sandkorn die Rolle eines einzelnen Akteurs:

Wenn kein Sandkorn unter mir ist, darf ich nach unten fallen.

Runde Körner bevorzugen seitliches Rutschen, wenn sie instabil liegen.

Eckige Körner bleiben eher an Ort und Stelle oder bewegen sich nur, wenn eine klare Fallrichtung existiert.

Die Oberfläche bzw. Topologie beeinflusst, wie Körner liegen bleiben oder abrutschen.

[Unverified] Die Regeln orientieren sich am bekannten Falling-Sand-Ansatz, sind jedoch vereinfacht und an die Anforderungen der Übungsaufgabe angepasst.

README – Fließsand-Zellulärer Automat
Projektziel

Simulation der Interaktion zweier Sandkorntypen (rund, eckig) auf einer Oberfläche mithilfe eines zellulären Automaten. Ziel ist die Analyse des Haufens, der sich durch wiederholtes Aufbringen von Sand bildet.

Hintergrund

Inspiriert durch Probleme in der Betontechnik: Unterschiedliche Körnungen verhalten sich im Schüttvorgang unterschiedlich – manche verrieseln stark, andere verklumpen oder bilden stabile Strukturen.

Features

 • Zwei Sandkornformen
 • Einstellbare Oberflächentopologie
 • Schrittweises Aufschütten („Sedimentierung“)
 • Einfaches Stabilitätsmaß (Differenz tiefster–höchster Punkt)
 • Lokale Regeln nach Falling-Sand-Prinzip

Regelwerk (Kurzfassung)

 1. Korn fällt, wenn darunter ein leerer Gitterplatz ist
 2. Runde Körner dürfen leichter seitlich rutschen
 3. Eckige Körner rutschen nur bei eindeutiger Fallrichtung
4. Topologie beeinflusst Fallrichtung (z. B. Schräge, Vertiefung)

Agentenperspektive (optional)

 „Ich bin das Sandkorn – wenn ich keinen Halt habe, falle ich. Wenn ich rund bin, rolle ich leichter zur Seite. Wenn ich eckig bin, bleibe ich lieber wie ich bin.“

Datei-/Projektbezug
 Siehe Begleitdokument FallingSand-Aufgabenstellung für Kontext und Rahmenbedingungen aus der Übung.

 10 - 20 Seiten / keine Ganzen Code Blcöke in der Docu



Person 1: Fachliches Konzept (Höller Maximmilian)

Kurze Recherche (z.B. aus „Cellular Automata.pdf“ / „Agent‑Based Modelling.pdf“),
Definition der Modellidee (Gitter, Zustände: leer/Sand/Wand/... und Regeln, wann ein Partikel fällt, rutscht etc.),
Beschreibung der Ziele und der geplanten Experimente.

Person 2: Simulationskern (Max Schimpf)

Implementierung der Datenstrukturen (Gitter, Partikelzustände),
Update‑Regeln als Algorithmus (z.B. zeilenweise Aktualisierung, Konfliktauflösung),


Person 3: Visualisierung & Interaktion (Kilian, Köck)

Darstellung der Simulation (2D‑Raster, Farben für Materialien),
Eingaben (Maus/Tastatur: Partikel „malen“, Parameter ändern),
ggf. einfache Menü‑ oder Slider‑Steuerung.

Person 4: Tests, Experimente & Dokumentation (Jonas,Höckner)

Testfälle (z.B. einfache Szenarien, in denen klar ist, wie sich das System verhalten soll),
Durchführung von Experimenten (verschiedene Parameter, Dichten, Startkonfigurationen),
Auswertung (Plots, Screenshots) und Schreiben des Berichts/Präsentation.
## Modellierung mit Cellular Automata (CA)
Die Simulation nutzt einen klassischen Cellular Automaton (CA) als mikroskopische Beschreibung. Das System arbeitet auf einem rechteckigen Lattice (kartesisches Grid), alle Zellen haben Zust?nde (`EMPTY`, `FINE`, `COARSE`, `WALL`). Die Nachbarschaften ergeben sich aus relativen Offsets ((i,j)->(i?1,j), (i,j?1), (i?1,j?1)) und erlauben sowohl Moore- als auch Von-Neumann-Stencils. `sim_core.py` pr?ft mit `_available(...)`, ob ein Nachbar g?ltig und leer ist, sodass auch R?nder korrekt behandelt werden.

`step()` l?uft ?ber diskrete Zeitpunkte t0,t1,... und folgt den Regeln: Fall in freien Raum (grid[y+1,x]==EMPTY), diagonales Gleiten mit Wahrscheinlichkeiten `p_fine`/`p_coarse` und seitliches Ausweichen f?r FEINE K?rner. `emit()` f?llt die Quelle zentral, `snapshot()` liefert das Grid plus Metriken (`delta_h`, `top_height`, `bottom_height`).

## Visualisierung & Steuerung auf drei Ebenen
1. **Sandbox (`sandbox.py`)** startet die Engine, optional den HTTP-Server (--api-port) und das Matplotlib-Fenster; `update_plot()` ruft emit + step auf und pr?sentiert die Snapshot-Metriken nach FRAMES.
2. **API (`simulation_api.py`)** bietet `GET /state`, `GET /metrics`, `GET /mix`/`/ratio`, `POST /step`/`/advance`, `POST /emit`, `POST /mix`/`/ratio` als saubere JSON-Schnittstelle. `/mix` akzeptiert Query oder JSON ("{"value":...}") und klammert das Ergebnis in `SimulationEngine.set_mix`.
3. **Qt-Client (`qt_client.py`)** nutzt `Qt.py`, `SimulationClient` (metrics, step, emit, set_mix) und `ControlPanel` (Slider, Step-Button, Delta-h-Label) f?r die dynamische Kartografie. Damit kann die Sandbox per API gesteuert werden, ohne dass Qt die Simulationslogik direkt kennt.

Diese Schichten stellen eine klare CA-Modellierung mit lokalem Update-Stencil, eine r?umliche Darstellung im Sandbox-Plot sowie eine API/Qt-basierte Steuerung bereit.

## Running the sandbox from Jupyter

You can launch the visualization directly inside a notebook cell by calling the CLI with a shell escape. Example:

```
!python sandbox.py --frames 200 --floor slope --floor-min 3 --floor-max 12
```

This command uses the `slope` floor profile and runs 200 animation steps; the `--floor-min` and `--floor-max` flags define the shallowest and deepest columns of the terrain.

## Floor profile options

`sandbox.py` accepts `--floor` choices `random`, `flat`, `slope`, and `stepped`. Each profile controls how the ground is shaped before sand is emitted:

- `random`: the original behavior; heights are drawn uniformly between `--floor-min` and `--floor-max`.
- `flat`: every column has the same height (`--floor-min`).
- `slope`: heights interpolate from `--floor-min` to `--floor-max` across the grid width.
- `stepped`: the terrain alternates between bands of low and high columns to emulate terraces.

Set `--floor-max` if you want to limit the depth of the floor; when omitted it defaults to roughly half the grid height.
