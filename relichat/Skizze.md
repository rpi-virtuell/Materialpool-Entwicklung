
![[relichat.png]]

Im Zentrum des Systems steht die reliChat-Anwendung, die als Beratungstool für den Religionsunterricht konzipiert ist. Der Prozessablauf lässt sich in mehrere Kernschritte aufteilen:

Der Prozess beginnt mit der Benutzereingabe über die Chat-Oberfläche, wo Lehrkräfte ihre Anfragen zum Religionsunterricht eingeben können. Das System analysiert zunächst die Fragestellung und den Bedarf (dargestellt durch die erste Raute "klärt Fragestellung/Bedarf").

Nach der Analyse generiert das System eine RAG-Anfrage (Retrieval Augmented Generation). Diese Technologie ermöglicht es, relevante Informationen aus verschiedenen Datenquellen gezielt abzurufen und zu verarbeiten.

Die Wissensbasis des Systems ist mehrschichtig aufgebaut:

- Eine materialbasierte Datenbank enthält strukturierte Informationen zu Unterrichtsentwürfen, Lernaktivitäten, Methoden, Medien und allgemeinen Informationen. Jeder dieser Bereiche hat spezifische Attribute - beispielsweise enthält ein Unterrichtsentwurf Angaben zu Verlaufsplan, Intention, Kompetenzen und Klassenstufe.

Das System kann bei Bedarf auf externe Ressourcen zugreifen:

- Über GraphQL-Schnittstellen werden Community-Ressourcen eingebunden, die Themen, Keywords und Zielgruppen-Informationen enthalten
- API-Zugriffe ermöglichen die Anbindung an OER-Portale wie Openverse, OERSI, WLO und Mundo
- Ein EDU-Feed-System ist ebenfalls angebunden

Der Kern der Verarbeitung liegt in der KI-gestützten Analyse ("prüft die Ergebnisse, wählt relevante aus und formuliert eine Antwort"). Hier werden die unterschiedlichen Aufgaben und Fähigkeiten der KI eingesetzt, um die passendsten Ressourcen auszuwählen und eine kohärente Antwort zu formulieren.

Besonders interessant ist die Integration von relilab Tutorials mit speziellen Kategorien für Kollaboration, Editor-Funktionen, generative KI und Bildbearbeitung. Dies deutet darauf hin, dass das System nicht nur Informationen bereitstellt, sondern auch aktiv bei der Materialerstellung und -bearbeitung unterstützt.

Die Architektur folgt damit einem modernen Multi-Agenten-Ansatz, wie er in den Dokumenten beschrieben ist, mit spezialisierten Agenten für verschiedene Aufgabenbereiche und einem übergeordneten Koordinator-Agenten. Dies ermöglicht eine flexible und effiziente Verarbeitung der Anfragen unter Einbeziehung aller verfügbaren Ressourcen.
(Die Interpretation und Beschreibung der Skizze wurde mit Claude Sonnet erstellt)
