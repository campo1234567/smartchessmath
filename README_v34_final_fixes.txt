V34 final fixes:
1) Final Ranking and Championship Details deduplicate repeated result rows per student/round.
2) Final totals now sum one official/best row for R1 + R2 + R3 only.
3) Student School / Academy is separated from Organizer.
4) Organizer appears as Organizer, not School.
5) Full Championship Details includes final rank.

Important:
- Run D1_UPDATE_V34_RUN_ONCE.sql once in D1 Console.
- Deploy worker_v34_final_fix.js to smartchessmath-api.
- Then upload this static site package.
