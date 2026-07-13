import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import {
  buildDescription,
  deriveDifficultyFactors,
} from "./profile-template.mjs";

const SOURCE_DIR =
  process.env.TERMINAL_BENCH_SOURCE ??
  "/private/tmp/justenough-extraction-20260713/terminal-bench-2-1";
const OUTPUT = new URL("../corpus/terminal-bench-2.1.jsonl", import.meta.url);
const CACHE_DIR =
  process.env.HARBOR_CACHE ??
  "/private/tmp/justenough-extraction-20260713/harbor-cache";
const REVISION = "d49e28f1e4ddd13d289e85a5f312a66750951932";
const REPOSITORY = "https://github.com/harbor-framework/terminal-bench-2-1";
const EXTRACTION_DATE = "2026-07-13";

function p(
  title,
  summary,
  intents,
  technologies,
  languages,
  workSurfaces,
  expectedArtifacts,
  demandClauses,
) {
  return {
    title,
    summary,
    description: buildDescription(summary, demandClauses),
    interaction: "terminal",
    intents,
    technologies,
    languages,
    work_surfaces: workSurfaces,
    expected_artifacts: expectedArtifacts,
    difficulty_factors: deriveDifficultyFactors({
      summary,
      demandClauses,
      technologies,
      languages,
      workSurfaces,
    }),
  };
}

const profiles = {
  "adaptive-rejection-sampler": p(
    "Implement adaptive rejection sampling in R",
    "Implement a modular R sampler for log-concave densities with input checks, distribution validation, formal tests, and generated sample output.",
    ["feature implementation", "test and validation"],
    ["adaptive rejection sampling", "R"],
    ["R"],
    ["statistical sampler", "test suite"],
    ["/app/ars.R", "sample data file"],
    ["provide ars(density_function, domain, n = sample_count)", "reject invalid domains, sample counts, and non-log-concave densities", "sample standard distributions with the target shape", "print named PASS or FAIL results with mean and standard deviation"],
  ),
  "bn-fit-modify": p(
    "Recover and intervene on a Bayesian network",
    "Recover a six-edge DAG from observations, fit its Bayesian network, intervene on Y at zero, and draw 10,000 samples from the result.",
    ["data transformation", "test and validation"],
    ["Bayesian networks", "causal inference", "CSV"],
    ["CSV"],
    ["graph structure", "statistical model", "dataset"],
    ["/app/learned_dag.csv", "/app/intervened_dag.csv", "/app/final_bn_sample.csv"],
    ["recover exactly six directed edges with U having no parents", "resolve ambiguous non-U directions using reverse alphabetical parent ordering", "set Y to 0.0 or variance 10e-9", "produce 10,000 intervened samples with the original columns"],
  ),
  "break-filter-js-from-html": p(
    "Create HTML that bypasses a JavaScript filter",
    "Create an HTML document that still executes an automatic alert after the supplied in-place JavaScript filter processes it.",
    ["security assessment"],
    ["HTML", "JavaScript", "XSS"],
    ["HTML", "JavaScript", "Python"],
    ["HTML document", "sanitization boundary"],
    ["/app/out.html"],
    ["survive processing by /app/filter.py", "trigger alert() automatically when opened", "require no user interaction"],
  ),
  "build-cython-ext": p(
    "Build pyknotid Cython extensions for NumPy 2.3",
    "Patch and install pyknotid 0.5.3 from source so its three Cython extensions work with NumPy 2.3.0 in the global Python environment.",
    ["bug repair", "systems setup", "test and validation"],
    ["pyknotid", "Cython", "NumPy 2.3.0", "Python packaging"],
    ["Python", "C", "Cython"],
    ["package build", "native extensions", "global Python environment"],
    ["/app/pyknotid", "installed pyknotid package"],
    ["clone branch 0.5.3 into /app/pyknotid", "compile chelpers, ccomplexity, and cinvariants", "preserve the package structure", "pass core tests except the two explicitly excluded files"],
  ),
  "build-pmars": p(
    "Build headless pMARS from Debian sources",
    "Build and install pMARS from Debian source packages with X11 disabled while retaining a working debugger and source tree.",
    ["systems setup", "configuration tuning"],
    ["pMARS", "Debian", "X11", "Core War"],
    ["C", "Makefile"],
    ["build system", "native binary"],
    ["/usr/local/bin/pmars", "/app/pmars-<version> source tree"],
    ["use Debian source packages", "build without X11 dependencies", "leave the extracted source tree in place", "retain debugger functionality"],
  ),
  "build-pov-ray": p(
    "Build POV-Ray 2.2 on a modern system",
    "Locate, patch, compile, and install the legacy POV-Ray 2.2 source so it reproduces the supplied reference scene.",
    ["systems setup", "bug repair", "test and validation"],
    ["POV-Ray 2.2", "ray tracing"],
    ["C"],
    ["build system", "renderer"],
    ["/app/povray-2.2", "/usr/local/bin/povray"],
    ["install the binary at /usr/local/bin/povray", "render /app/deps/illum1.pov against the reference", "leave /app/deps/illum1.pov unchanged"],
  ),
  "caffe-cifar-10": p(
    "Train a CPU-only Caffe model on CIFAR-10",
    "Build BVLC Caffe 1.0.0 for CPU execution and train CIFAR-10 for exactly 500 iterations while meeting the stated accuracy bounds.",
    ["systems setup", "model training", "test and validation"],
    ["BVLC Caffe 1.0.0", "CIFAR-10", "convolutional neural networks"],
    ["Protocol Buffers"],
    ["model training", "build system", "solver configuration"],
    ["/app/caffe", "training_output.txt", "cifar10_quick_iter_500.caffemodel"],
    ["build Caffe for CPU-only execution", "train for exactly 500 iterations", "evaluate over 100 test iterations", "achieve test accuracy above 45% and within five percentage points of train accuracy"],
  ),
  "cancel-async-tasks": p(
    "Run bounded async tasks with cancellation cleanup",
    "Implement a Python async task runner that limits concurrency and guarantees cleanup for running and queued work when execution is cancelled.",
    ["feature implementation", "bug repair"],
    ["Python asyncio"],
    ["Python"],
    ["concurrency scheduler", "cancellation handling"],
    ["/app/run.py"],
    ["export async run_tasks(tasks, max_concurrent)", "never exceed max_concurrent", "allow task cleanup code to run after keyboard interruption", "handle cancellation while tasks remain queued"],
  ),
  "chess-best-move": p(
    "Find the best move from a chessboard image",
    "Read a white-to-move chess position from an image and write every winning move in coordinate notation.",
    ["data transformation", "test and validation"],
    ["chess", "image analysis"],
    ["plain text"],
    ["board position", "move analysis"],
    ["/app/move.txt"],
    ["treat the supplied position as white to move", "write moves as four-character source and destination coordinates", "place multiple winning moves on separate lines"],
  ),
  "circuit-fibsqrt": p(
    "Build a gate circuit for Fibonacci of integer square root",
    "Describe a logic-gate circuit that maps a 32-bit integer to fib(isqrt(N)) modulo 2^32 within the simulator's line and step limits.",
    ["feature implementation", "performance optimization"],
    ["logic gates", "digital circuits", "Fibonacci sequence"],
    ["gate netlist"],
    ["combinational logic", "sequential logic"],
    ["/app/gates.txt"],
    ["use only the simulator's assignment, NOT, AND, OR, and XOR forms", "contain fewer than 32,000 lines", "produce the result after 32,000 simulation steps", "return fib(floor(sqrt(N))) modulo 2^32"],
  ),
  "cobol-modernization": p(
    "Reimplement COBOL file processing in Python",
    "Reproduce a GnuCOBOL program in Python so it performs byte-identical updates to the account, book, and transaction data files.",
    ["feature implementation", "data transformation", "test and validation"],
    ["GnuCOBOL 3"],
    ["COBOL", "Python"],
    ["business logic", "record files"],
    ["/app/program.py", "updated DAT files"],
    ["read /app/src/INPUT.DAT", "match the COBOL logic exactly", "produce byte-identical ACCOUNTS.DAT, BOOKS.DAT, and TRANSACTIONS.DAT files"],
  ),
  "code-from-image": p(
    "Execute pseudocode recovered from an image",
    "Recover the intended pseudocode from an image, implement its cryptographic computation, and write the resulting value.",
    ["data transformation", "feature implementation"],
    ["OCR", "cryptographic hashing"],
    ["plain text"],
    ["image content", "algorithm implementation"],
    ["/app/output.txt"],
    ["derive the logic from /app/code.png", "produce the exact final printed value", "ensure the result begins with bee26a"],
  ),
  "compile-compcert": p(
    "Build CompCert 3.13.1 from source",
    "Configure and build the CompCert 3.13.1 verified C compiler for the host operating system and architecture.",
    ["systems setup", "test and validation"],
    ["CompCert 3.13.1", "verified compilation"],
    ["C", "OCaml", "Coq"],
    ["compiler toolchain", "build system"],
    ["/tmp/CompCert/ccomp"],
    ["build freshly from /tmp/CompCert", "target the current operating system and instruction set", "leave a functional ccomp executable at the required path"],
  ),
  "configure-git-webserver": p(
    "Deploy Git pushes through Nginx",
    "Configure a Git repository and post-receive deployment so pushes to master become static content served by Nginx on port 8080.",
    ["systems setup", "configuration tuning"],
    ["Git", "Nginx", "SSH", "HTTP"],
    ["shell"],
    ["Git server", "deployment hook", "HTTP server"],
    ["Git repository at /git/server", "deployed static website"],
    ["accept clones at user@server:/git/server", "deploy each master push automatically", "serve pushed files on HTTP port 8080"],
  ),
  "constraints-scheduling": p(
    "Schedule a constrained team meeting",
    "Find the earliest valid one-hour slot for three attendees, apply availability and preference tie-breakers, and emit a standards-compliant calendar event.",
    ["data transformation", "configuration tuning"],
    ["iCalendar", "ICS", "UTC"],
    ["ICS"],
    ["calendar data", "scheduling constraints"],
    ["/app/meeting_scheduled.ics"],
    ["schedule within January 15–19, 2024 business hours", "avoid all source calendar conflicts and preserve the input files", "apply Carol's Monday avoidance then Alice's morning preference as tie-breakers", "include all three attendees and use UTC timestamps in a valid VEVENT"],
  ),
  "count-dataset-tokens": p(
    "Count science-domain DeepSeek tokens",
    "Count Qwen2.5-1.5B-Instruct tokens in the science subset of the OpenThoughts-1k-sample dataset and write the exact integer total.",
    ["data transformation"],
    ["Hugging Face datasets", "Qwen2.5-1.5B-Instruct", "OpenThoughts-1k-sample"],
    ["plain text"],
    ["dataset", "tokenizer"],
    ["/app/answer.txt"],
    ["use ryanmarten/OpenThoughts-1k-sample", "filter to the science domain", "tokenize with Qwen2.5-1.5B-Instruct", "write digits only without separators"],
  ),
  "crack-7z-hash": p(
    "Recover a password-protected 7z secret",
    "Recover the password for the supplied 7z archive and extract the word stored in secret_file.txt.",
    ["security assessment", "data transformation"],
    ["7-Zip", "John the Ripper"],
    ["plain text"],
    ["encrypted archive", "password recovery"],
    ["/app/solution.txt"],
    ["open secrets.7z", "extract the word from secret_file.txt", "write only the recovered content to /app/solution.txt"],
  ),
  "custom-memory-heap-crash": p(
    "Fix a release-only C++ heap crash",
    "Repair a release-only C++ crash involving custom libstdc++ memory initialization while limiting edits to user.cpp and eliminating leaks.",
    ["bug repair", "test and validation"],
    ["GCC", "libstdc++", "Valgrind", "custom allocators"],
    ["C++"],
    ["memory management", "static initialization"],
    ["/app/user.cpp"],
    ["modify no existing file except /app/user.cpp", "work with both supplied debug and release libstdc++ builds", "eliminate the release-mode crash", "produce no Valgrind memory leaks"],
  ),
  "db-wal-recovery": p(
    "Recover an encrypted SQLite WAL",
    "Repair the encrypted or corrupted SQLite write-ahead log and export all eleven database rows as sorted JSON.",
    ["data recovery", "data transformation"],
    ["SQLite", "WAL", "XOR encryption", "JSON"],
    ["JSON"],
    ["database storage", "write-ahead log"],
    ["repaired WAL file", "/app/recovered.json"],
    ["make SQLite recognize the WAL changes", "recover all 11 records", "serialize id, name, and value", "sort output records by id"],
  ),
  "distribution-search": p(
    "Find a distribution with dual KL divergence 10",
    "Numerically construct a valid 150,000-element probability distribution whose forward and backward KL divergences from uniform both equal 10 within 0.001.",
    ["configuration tuning", "test and validation"],
    ["NumPy", "SciPy", "Kullback–Leibler divergence"],
    ["Python", "NumPy binary format"],
    ["numerical optimization", "probability distribution"],
    ["/app/dist.npy"],
    ["use vocabulary size 150,000", "keep probabilities valid and normalized", "meet |KL(P||U) - 10| ≤ 0.001", "meet |KL(U||P) - 10| ≤ 0.001"],
  ),
  "dna-assembly": p(
    "Design primers for Golden Gate plasmid assembly",
    "Design the minimum primer set for one-pot BsaI-HF v2 assembly of the supplied plasmid and protein fragments into the target sequence.",
    ["data transformation", "configuration tuning"],
    ["PCR", "Golden Gate assembly", "BsaI-HF v2", "primer3"],
    ["FASTA", "DNA"],
    ["primer design", "plasmid assembly"],
    ["primers.fasta"],
    ["use 15–45 nucleotide template-annealing segments", "keep annealing Tm at 58–72°C and paired values within 5°C using the specified oligotm flags", "produce the minimum number of primer pairs", "format headers as >TEMPLATENAME_DIR without blank lines"],
  ),
  "dna-insert": p(
    "Design Q5 mutagenesis primers",
    "Design the minimum primer set that converts the circular input plasmid to the target sequence using the Q5 site-directed mutagenesis kit.",
    ["data transformation", "configuration tuning"],
    ["PCR", "Q5 site-directed mutagenesis", "primer3"],
    ["FASTA", "DNA"],
    ["primer design", "plasmid sequence"],
    ["primers.fasta"],
    ["use 15–45 nucleotide input-annealing segments", "keep annealing Tm at 58–72°C and paired values within 5°C using the specified oligotm flags", "emit the minimum number of primer pairs", "list each forward primer before its reverse partner"],
  ),
  "extract-elf": p(
    "Extract initialized memory values from an ELF binary",
    "Implement a Node.js utility that reads an ELF executable and emits accurate address-to-integer mappings for at least 75 percent of its initialized memory.",
    ["data transformation", "feature implementation"],
    ["ELF", "Node.js", "JSON"],
    ["JavaScript", "C", "JSON"],
    ["binary format", "memory image"],
    ["/app/extract.js"],
    ["accept an ELF path on the command line", "write a JSON object to standard output", "serialize addresses as keys and values as integers", "include at least 75% of reference memory values with no incorrect included values"],
  ),
  "extract-moves-from-video": p(
    "Transcribe Zork moves from a video",
    "Transcribe every command entered during the supplied Zork gameplay video and write the moves in chronological order.",
    ["data transformation"],
    ["video processing", "OCR"],
    ["plain text"],
    ["video frames", "command transcript"],
    ["/app/solution.txt"],
    ["process /app/video.mp4", "include only entered moves", "write one move per line", "reach at least 90% transcription accuracy"],
  ),
  "feal-differential-cryptanalysis": p(
    "Recover a FEAL round key with differential cryptanalysis",
    "Implement a chosen-plaintext differential attack against the supplied FEAL-like cipher that returns the sixth 32-bit round key within 30 seconds.",
    ["security assessment", "feature implementation"],
    ["FEAL", "differential cryptanalysis", "chosen-plaintext attack"],
    ["Python"],
    ["block cipher", "cryptanalytic attack"],
    ["/app/attack.py"],
    ["export attack(encrypt_fn)", "recover key[5] as a uint32 value", "use chosen plaintext queries", "finish in under 30 seconds"],
  ),
  "feal-linear-cryptanalysis": p(
    "Recover a FEAL key with linear cryptanalysis",
    "Use known plaintext-ciphertext pairs to recover the FEAL-like cipher key and decrypt every supplied ciphertext.",
    ["security assessment", "data transformation"],
    ["FEAL", "linear cryptanalysis", "known-plaintext attack"],
    ["C"],
    ["block cipher", "cryptanalytic attack"],
    ["/app/plaintexts.txt"],
    ["derive the key from 32 pairs in /app/pairs.txt", "account for four round keys derived from 20-bit seeds", "decrypt every entry in /app/ciphertexts.txt", "write recovered plaintexts in the corresponding order"],
  ),
  "filter-js-from-html": p(
    "Remove JavaScript from HTML safely",
    "Implement an in-place HTML sanitizer that removes executable JavaScript while preserving legitimate structure, content, attributes, and formatting.",
    ["security remediation", "feature implementation"],
    ["HTML", "JavaScript", "XSS"],
    ["Python", "HTML", "JavaScript"],
    ["HTML parser", "sanitization boundary"],
    ["/app/filter.py"],
    ["accept the HTML path as argv[1]", "modify the source file in place", "remove all executable JavaScript", "preserve harmless HTML and avoid formatting changes beyond parser normalization"],
  ),
  "financial-document-processor": p(
    "Classify financial documents and summarize invoices",
    "Classify mixed PDF and JPEG documents, move them by type, extract invoice totals and tax, and generate an aggregate CSV summary.",
    ["data transformation", "feature implementation"],
    ["OCR", "PDF", "JPEG", "CSV"],
    ["CSV"],
    ["document collection", "filesystem", "invoice data"],
    ["/app/invoices/summary.csv", "classified invoice files", "classified other files"],
    ["move every source document out of /app/documents", "prefer Total over a differing Amount Due", "use zero or blank when VAT is absent", "write exactly filename, total_amount, and vat_amount columns plus a final total row"],
  ),
  "fix-code-vulnerability": p(
    "Fix CRLF injection in Bottle headers",
    "Identify and repair the Bottle header-validation flaw that permits CRLF injection, report its CWE, and preserve the repository's test behavior.",
    ["security remediation", "bug repair", "test and validation"],
    ["Bottle", "WSGI", "HTTP headers", "CWE"],
    ["Python", "JSON Lines"],
    ["HTTP header handling", "input validation"],
    ["patched /app/bottle.py", "/app/report.jsonl"],
    ["report /app/bottle.py with CWE-93", "reject carriage-return and line-feed input", "raise the expected specific error type for invalid input", "make the full pytest suite pass"],
  ),
  "fix-git": p(
    "Recover detached Git work into master",
    "Locate personal-site changes left on an unreachable or detached commit and merge them into the master branch.",
    ["data recovery", "bug repair"],
    ["Git"],
    ["Git object format"],
    ["commit graph", "branch history"],
    ["master branch containing the recovered changes"],
    ["find the missing commit or commits", "merge recovered work into master", "preserve the existing repository history"],
  ),
  "fix-ocaml-gc": p(
    "Repair run-length compression in the OCaml garbage collector",
    "Debug a broken major-heap sweep optimization so the OCaml compiler bootstraps and its basic tests run cleanly.",
    ["bug repair", "performance optimization", "test and validation"],
    ["OCaml compiler", "garbage collection", "major heap"],
    ["OCaml", "C"],
    ["garbage collector", "compiler bootstrap"],
    ["repaired OCaml source tree"],
    ["retain run-length-compressed free-space sweeping", "complete compiler bootstrap without crashing", "pass make -C testsuite one DIR=tests/basic"],
  ),
  "gcode-to-text": p(
    "Decode printed text from G-code",
    "Analyze Prusa MK4S movement commands to determine the text deposited by the supplied G-code and write the decoded string.",
    ["data transformation"],
    ["G-code", "Prusa MK4S", "OCR"],
    ["G-code"],
    ["toolpath", "rendered text"],
    ["/app/out.txt"],
    ["read text.gcode", "derive the visible printed text from movement paths", "write the decoded text to /app/out.txt"],
  ),
  "git-leak-recovery": p(
    "Recover and purge a leaked Git secret",
    "Recover a secret from unreachable Git objects, save it separately, and remove every repository copy without disturbing unrelated history.",
    ["data recovery", "security remediation"],
    ["Git"],
    ["Git object format"],
    ["Git object database", "repository history"],
    ["/app/secret.txt", "sanitized /app/repo"],
    ["recover the only secret[...] string", "write the recovered value to /app/secret.txt", "make the value undiscoverable anywhere in /app/repo", "preserve unrelated files and commit messages"],
  ),
  "git-multibranch": p(
    "Deploy Git branches to separate HTTPS paths",
    "Configure an SSH Git server whose post-receive hook deploys main and dev branches to distinct Nginx HTTPS locations within three seconds.",
    ["systems setup", "configuration tuning"],
    ["Git", "SSH", "Nginx", "HTTPS", "TLS"],
    ["shell"],
    ["Git server", "deployment hook", "HTTPS server"],
    ["Git repository at /git/project", "self-signed certificate", "branch-specific website deployments"],
    ["accept password-authenticated git@localhost access with password password", "serve main at https://localhost:8443/index.html", "serve dev at https://localhost:8443/dev/index.html", "deploy each push within three seconds"],
  ),
  "gpt2-codegolf": p(
    "Implement compact GPT-2 inference in C",
    "Write a dependency-free C program under 5,000 bytes that loads GPT-2 TensorFlow checkpoints and BPE vocabulary and emits 20 argmax tokens.",
    ["feature implementation", "performance optimization"],
    ["GPT-2", "TensorFlow checkpoints", "BPE", "GCC"],
    ["C"],
    ["model inference", "checkpoint loader", "tokenizer"],
    ["/app/gpt2.c"],
    ["remain under 5,000 source bytes", "compile with gcc -O3 -lm without dependencies", "read the checkpoint, BPE file, and prompt from command-line arguments", "continue output for exactly 20 argmax-selected tokens"],
  ),
  "headless-terminal": p(
    "Implement a persistent headless terminal",
    "Implement the supplied terminal interface over an interactive Bash process with persistent state, startup-file loading, interactive programs, and control-key support.",
    ["feature implementation"],
    ["Bash", "pseudo-terminals"],
    ["Python"],
    ["terminal session", "interactive shell"],
    ["/app/headless_terminal.py"],
    ["export HeadlessTerminal(BaseTerminal)", "start an interactive Bash shell that sources startup files", "preserve shell state between commands", "forward modifier keys such as Ctrl-C and support interactive programs"],
  ),
  "hf-model-inference": p(
    "Serve Hugging Face sentiment inference",
    "Download the specified DistilBERT sentiment model and run a background Flask API that returns positive and negative confidence scores.",
    ["systems setup", "feature implementation"],
    ["Hugging Face Transformers", "DistilBERT", "Flask", "HTTP", "JSON"],
    ["Python", "JSON"],
    ["model cache", "HTTP API", "background service"],
    ["/app/model_cache/sentiment_model", "Flask service on port 5000"],
    ["serve POST /sentiment on 0.0.0.0:5000", "accept a JSON text string", "return sentiment plus positive and negative confidence values", "return JSON error messages with HTTP 400 for invalid requests"],
  ),
  "install-windows-3.11": p(
    "Run Windows 3.11 in a controllable QEMU VM",
    "Boot the supplied Windows 3.11 image in snapshot mode with VNC, an Nginx web interface, and a monitor socket for programmatic keyboard input.",
    ["systems setup", "configuration tuning"],
    ["QEMU 5.2.0", "Windows 3.11", "VNC", "Nginx"],
    ["disk image"],
    ["virtual machine", "VNC service", "HTTP server", "monitor socket"],
    ["running Windows 3.11 VM", "/tmp/qemu-monitor.sock", "web interface on port 80"],
    ["keep /app/isos/win311.img immutable using snapshot mode", "serve VNC display :1 on port 5901", "leave the VM at the Windows desktop", "accept external keyboard control through the QEMU monitor"],
  ),
  "kv-store-grpc": p(
    "Run a gRPC key-value service",
    "Define, generate, and run a Python gRPC service that stores integer values under string keys and exposes GetVal and SetVal RPCs.",
    ["feature implementation", "systems setup"],
    ["gRPC 1.73.0", "Protocol Buffers", "Python"],
    ["Python", "Protocol Buffers"],
    ["RPC API", "in-memory store", "background service"],
    ["/app/kv-store.proto", "generated Python stubs", "/app/server.py", "service on port 5328"],
    ["define KVStore with GetVal and SetVal", "use string keys and integer values", "implement class Server over a Python dictionary", "leave the service running on port 5328"],
  ),
  "large-scale-text-editing": p(
    "Transform a million-row CSV with Vim macros",
    "Create a restricted Vim script containing three compact macros that transforms input.csv to the expected file byte for byte.",
    ["data transformation", "performance optimization"],
    ["Vim", "CSV"],
    ["Vim script", "CSV"],
    ["text editor", "macro registers"],
    ["/app/apply_macros.vim", "transformed /app/input.csv"],
    ["define non-empty registers a, b, and c with fewer than 200 total keystrokes", "use only allowed setreg, %normal, and exit commands", "run headlessly with Vim", "match /app/expected.csv byte for byte"],
  ),
  "largest-eigenval": p(
    "Accelerate dominant eigenpair computation",
    "Implement a faster Python entrypoint for the largest-magnitude eigenpair of small real nonsymmetric matrices while retaining complex-valued correctness.",
    ["performance optimization", "feature implementation", "test and validation"],
    ["NumPy", "eigenvalue decomposition"],
    ["Python"],
    ["numerical kernel"],
    ["/app/eigen.py"],
    ["handle square float64 matrices up to 10×10", "select the eigenvalue with largest magnitude", "satisfy A @ eigenvec ≈ eigenval * eigenvec for real or complex pairs", "beat the median runtime of the reference NumPy implementation"],
  ),
  "llm-inference-batching-scheduler": p(
    "Optimize shape-aware LLM inference batches",
    "Pack every request from two buckets into static-shape batches that obey alignment and shape limits while meeting cost, padding, latency, and time thresholds.",
    ["performance optimization", "configuration tuning", "data transformation"],
    ["LLM inference", "static graphs", "JSON Lines"],
    ["JSON Lines", "Python"],
    ["batch scheduler", "tensor shapes"],
    ["/app/task_file/output_data/plan_b1.jsonl", "/app/task_file/output_data/plan_b2.jsonl"],
    ["include every request exactly once", "use seq_align multiples of 64 with heads_align 32 and hidden_align 4096", "use no more than eight unique shapes across both buckets", "keep shapes identical within a batch", "meet every published per-bucket performance threshold"],
  ),
  "log-summary-date-ranges": p(
    "Summarize log severities by date range",
    "Count ERROR, WARNING, and INFO events across five fixed date ranges from date-stamped logs and emit rows in the required CSV order.",
    ["data transformation"],
    ["CSV", "log files"],
    ["CSV"],
    ["log collection", "date aggregation"],
    ["/app/summary.csv"],
    ["use 2025-08-12 as the reference date", "derive dates from YYYY-MM-DD_<source>.log filenames", "calculate today, last 7 days, last 30 days, month to date, and total", "write the exact period,severity,count row ordering"],
  ),
  "mailman": p(
    "Configure a confirmed-opt-in Mailman list",
    "Configure Postfix and Mailman 3 for a local reading-group list with confirmed join and leave messages and subscriber announcements delivered to Unix mailboxes.",
    ["systems setup", "configuration tuning"],
    ["Mailman 3", "Postfix", "email", "mbox"],
    ["INI", "email"],
    ["mailing list", "mail transport", "local mailboxes"],
    ["/etc/mailman3/mailman.cfg", "reading-group@local.edu mailing list"],
    ["support join and leave addresses with user confirmation", "deliver announcements to all subscribers without owner approval", "map <user>@local.edu to /var/mail/<username>", "set SubscriptionPolicy.open"],
  ),
  "make-doom-for-mips": p(
    "Cross-compile DOOM for a MIPS emulator",
    "Build the supplied DOOM source into the expected MIPS ELF so vm.js runs it and the custom frame writer produces bitmap frames.",
    ["systems setup", "feature implementation", "test and validation"],
    ["DOOM", "MIPS", "LLVM", "Node.js", "ELF", "BMP"],
    ["C", "JavaScript"],
    ["cross-compiler toolchain", "game runtime", "frame output"],
    ["/app/doomgeneric_mips"],
    ["use the supplied doomgeneric_img.c frame backend", "produce a MIPS ELF named doomgeneric_mips", "run under node vm.js", "write rendered frames to /tmp/frame.bmp"],
  ),
  "make-mips-interpreter": p(
    "Implement a MIPS interpreter that boots DOOM",
    "Implement a JavaScript MIPS ELF interpreter with system calls and file access that boots the supplied DOOM binary and saves rendered frames.",
    ["feature implementation", "systems setup"],
    ["MIPS", "ELF", "DOOM", "Node.js"],
    ["JavaScript", "C"],
    ["CPU interpreter", "system calls", "frame output"],
    ["/app/vm.js", "rendered frame files"],
    ["execute /app/doomgeneric_mips", "implement required system calls and file I/O", "boot DOOM successfully", "create the correct first rendered frame and subsequent frames"],
  ),
  "mcmc-sampling-stan": p(
    "Sample a hierarchical beta-binomial model with RStan",
    "Implement and run the specified hierarchical Bayesian model in RStan, then save reproducible posterior means for alpha and beta.",
    ["model training", "systems setup", "data transformation"],
    ["RStan 2.32.7", "Stan", "MCMC", "beta-binomial model"],
    ["R", "Stan", "CSV"],
    ["probabilistic model", "sampling pipeline", "posterior estimates"],
    ["/app/hierarchical_model.stan", "/app/analysis.R", "/app/posterior_alpha_mean.txt", "/app/posterior_beta_mean.txt"],
    ["model y_i as Binomial(n_i, theta_i) and theta_i as Beta(alpha, beta)", "use prior proportional to (alpha + beta)^(-5/2)", "sample four chains with 100,000 iterations each and seed 1", "write one posterior mean per result file"],
  ),
  "merge-diff-arc-agi-task": p(
    "Merge Git bundles and implement the inferred grid mapping",
    "Import two bundles as named branches, merge them with conflicts resolved, and implement the grid transformation implied by the ARC-style examples.",
    ["data transformation", "bug repair", "feature implementation"],
    ["Git", "ARC-AGI", "JSON"],
    ["Python", "JSON"],
    ["branch history", "merge conflicts", "grid transformation"],
    ["/app/repo with branch1 and branch2", "/app/repo/algo.py"],
    ["fetch each bundle HEAD into its required branch name", "use branch1 as the merge base and merge branch2", "export map for two-dimensional integer arrays", "match all examples and generalize to hidden grids"],
  ),
  "model-extraction-relu-logits": p(
    "Extract hidden weights from a ReLU network",
    "Query a black-box one-hidden-layer ReLU function to recover its first-layer weight matrix up to neuron permutation and scaling.",
    ["security assessment", "data transformation"],
    ["ReLU neural networks", "NumPy", "black-box model extraction"],
    ["Python", "NumPy binary format"],
    ["model inference API", "hidden-layer parameters"],
    ["/app/steal.py", "/app/stolen_A1.npy"],
    ["query forward(x) over ten-dimensional inputs", "infer the unknown hidden-layer width", "recover A1 up to row permutation and scaling", "save the matrix as a NumPy array"],
  ),
  "modernize-scientific-stack": p(
    "Modernize a Python 2 climate analysis script",
    "Reimplement the legacy climate analysis for current Python using pandas and pathlib while preserving station coverage and formatted mean-temperature output.",
    ["feature implementation", "data transformation", "systems setup"],
    ["pandas", "NumPy", "configparser", "pathlib"],
    ["Python", "CSV", "INI"],
    ["analysis script", "dependency specification"],
    ["/app/analyze_climate_modern.py", "/app/requirements.txt or /app/pyproject.toml"],
    ["leave the legacy script unchanged", "read CSV with UTF-8 and paths through pathlib", "process stations 101 and 102", "print each mean to one decimal degree Celsius", "declare numpy, pandas, and matplotlib or scipy with version constraints"],
  ),
  "mteb-leaderboard": p(
    "Find the top Scandinavian MTEB embedding model",
    "Identify the complete-coverage model with the highest Mean (Task) score on the Scandinavian MTEB leaderboard as of August 2025.",
    ["data transformation", "test and validation"],
    ["MTEB", "text embeddings"],
    ["plain text"],
    ["leaderboard", "model comparison"],
    ["/app/result.txt"],
    ["use the Scandinavian MTEB leaderboard as of August 2025", "consider only models with results for every task", "maximize Mean (Task)", "write the model as organization/model_name"],
  ),
  "mteb-retrieve": p(
    "Retrieve the fifth-nearest document with MTEB",
    "Encode the query and line-delimited corpus with the pinned Chinese BGE model and return the document ranked fifth by cosine similarity.",
    ["data transformation"],
    ["MTEB 1.36.8", "bge-small-zh-v1.5", "cosine similarity"],
    ["plain text"],
    ["embedding model", "document corpus", "retrieval ranking"],
    ["/app/result.txt"],
    ["use query terminal-bench", "load revision 7999e1d3359715c523056ef9478215996d62a620", "encode through installed MTEB 1.36.8", "write the fifth-highest-similarity source line"],
  ),
  "multi-source-data-merger": p(
    "Merge prioritized user records across three formats",
    "Normalize and merge JSON, CSV, and Parquet user data by user ID with deterministic source priority and a complete field-level conflict report.",
    ["data transformation"],
    ["JSON", "CSV", "Parquet", "pandas"],
    ["JSON", "CSV", "Parquet", "Python"],
    ["ETL pipeline", "schema mapping", "conflict resolution"],
    ["/app/merged_users.parquet", "/app/conflicts.json"],
    ["map all specified field aliases to the canonical schema", "include every unique user exactly once", "resolve conflicts using source_a then source_b then source_c", "normalize dates to YYYY-MM-DD and user_id to integer", "report each differing field and selected value"],
  ),
  "nginx-request-logging": p(
    "Configure Nginx request logging and rate limits",
    "Run Nginx on port 8080 with static content, detailed access logs, a custom 404 page, and per-IP request limiting.",
    ["systems setup", "configuration tuning", "test and validation"],
    ["Nginx", "HTTP"],
    ["Nginx configuration", "HTML"],
    ["HTTP server", "request logging", "rate limiter", "filesystem"],
    ["/etc/nginx/conf.d/benchmark-site.conf", "static index and 404 pages", "Nginx log files"],
    ["listen on port 8080 and serve /var/www/html", "log time, method, status, and quoted user agent to benchmark-access.log", "allow 10 requests per second per IP with burst 10 in a 10MB zone", "serve /404.html for missing pages", "disable the default site and pass nginx syntax validation"],
  ),
  "openssl-selfsigned-cert": p(
    "Generate and verify an internal TLS certificate",
    "Create a 2048-bit RSA key and one-year self-signed certificate for the specified internal host, plus combined and human-readable verification artifacts.",
    ["systems setup", "test and validation"],
    ["OpenSSL", "TLS", "RSA", "X.509", "PEM"],
    ["Python"],
    ["certificate store", "private key", "verification utility"],
    ["/app/ssl/server.key", "/app/ssl/server.crt", "/app/ssl/server.pem", "/app/ssl/verification.txt", "/app/check_cert.py"],
    ["generate a 2048-bit RSA key with mode 600", "set organization DevOps Team and common name dev-internal.company.local", "make the certificate valid for 365 days", "record subject, validity dates, and SHA-256 fingerprint", "print the common name, expiration date, and success message from check_cert.py"],
  ),
  "overfull-hbox": p(
    "Eliminate LaTeX overfull boxes with allowed synonyms",
    "Replace words in input.tex only with their permitted synonyms until the document compiles without overfull hbox warnings.",
    ["bug repair", "configuration tuning", "test and validation"],
    ["LaTeX", "pdfLaTeX"],
    ["TeX"],
    ["document text", "typesetting layout"],
    ["updated input.tex", "compiled LaTeX document"],
    ["edit only input.tex", "make only synonym replacements listed in synonyms.txt", "leave main.tex and synonyms.txt unchanged", "compile successfully with no overfull hbox warnings"],
  ),
  "password-recovery": p(
    "Recover a deleted password from a disk image",
    "Perform file-system forensics to recover candidate values from a deleted launchcode.txt and write every value matching the exact password pattern.",
    ["data recovery", "security assessment"],
    ["disk forensics", "file recovery"],
    ["plain text"],
    ["disk image", "deleted file content"],
    ["/app/recovered_passwords.txt"],
    ["recover values associated with deleted launchcode.txt", "match exactly 23 uppercase alphanumeric characters", "require prefix 8XD and suffix W54", "write one candidate per line"],
  ),
  "path-tracing": p(
    "Reconstruct a path-traced image algorithmically",
    "Write a compact standalone C renderer that reproduces the supplied PPM image with at least 0.99 normalized L2 similarity without reading it at runtime.",
    ["feature implementation", "performance optimization", "test and validation"],
    ["path tracing", "PPM", "GCC"],
    ["C"],
    ["renderer", "image output"],
    ["image.c", "reconstructed.ppm"],
    ["avoid reading image.ppm", "reach at least 0.99 normalized L2 similarity", "remain below 2KB when gzip-compressed", "compile statically with gcc and use no auxiliary source files"],
  ),
  "path-tracing-reverse": p(
    "Recreate a compiled path tracer in C",
    "Reverse-engineer the mystery executable into compact standalone C source whose isolated behavior and generated output are identical.",
    ["feature implementation", "data transformation", "test and validation"],
    ["binary analysis", "GCC"],
    ["C"],
    ["native executable", "renderer"],
    ["/app/mystery.c"],
    ["match the operation of /app/mystery exactly", "remain below 2KB when gzip-compressed", "do not invoke the original executable", "run independently after static compilation"],
  ),
  "polyglot-c-py": p(
    "Write a Python and C Fibonacci polyglot",
    "Create one source file that runs under Python 3.12.3 and compiles under GCC 13.2.0 to print the requested Fibonacci number.",
    ["feature implementation"],
    ["Python 3.12.3", "GCC 13.2.0", "polyglot programming"],
    ["Python", "C"],
    ["command-line program", "source parser compatibility"],
    ["/app/polyglot/main.py.c"],
    ["execute directly with python3", "compile and execute with gcc", "accept N as the command-line argument", "use f(0)=0 and f(1)=1 and print the same result in both runtimes"],
  ),
  "polyglot-rust-c": p(
    "Write a Rust and C++ Fibonacci polyglot",
    "Create one source file accepted by Rust 1.75.0 and G++ 13.2.0 that prints the same shifted Fibonacci sequence value.",
    ["feature implementation"],
    ["Rust 1.75.0", "G++ 13.2.0", "polyglot programming"],
    ["Rust", "C++"],
    ["command-line program", "source parser compatibility"],
    ["/app/polyglot/main.rs"],
    ["compile and run with rustc", "compile the same file as C++ with g++ -x c++", "accept N as the command-line argument", "use f(0)=1, f(1)=1, and f(2)=2 in both runtimes"],
  ),
  "portfolio-optimization": p(
    "Accelerate portfolio calculations with a C extension",
    "Complete the Python extension so portfolio risk and return match the baseline within 1e-10 and run at least 1.2 times faster at scale.",
    ["performance optimization", "feature implementation", "test and validation"],
    ["Python C API", "portfolio optimization", "covariance matrices"],
    ["C", "Python"],
    ["native extension", "numerical kernel"],
    ["portfolio_optimized.c", "portfolio_optimized.py", "built Python extension"],
    ["compute sqrt(x^T S x) and x^T r", "match the Python baseline within 1e-10", "run at least 1.2× faster for 5,000 or more assets", "support portfolios up to 8,000 assets"],
  ),
  "protein-assembly": p(
    "Design a FRET fusion-protein gBlock",
    "Design a codon sequence for the prescribed five-part fusion protein with exact spectral choices, linker ordering, binding functions, and synthesis constraints.",
    ["data transformation", "configuration tuning"],
    ["FRET", "FPbase", "Protein Data Bank", "gBlock", "codon optimization"],
    ["DNA", "FASTA", "GenBank"],
    ["protein design", "DNA sequence"],
    ["/app/gblock.txt"],
    ["order antibody binder, donor, DHFR, acceptor, then molecule binder", "use PDB proteins for molecule binder, donor, and acceptor and plasmid DHFR", "match donor emission 610nm and acceptor excitation 505nm from FPbase", "place 5–20 amino-acid GS linkers only between subproteins", "omit start, stop, and noninitial N-terminal methionines", "stay within 3,000 nt and 30–70% GC in every 50-nt window"],
  ),
  "prove-plus-comm": p(
    "Complete a Coq proof of addition commutativity",
    "Fill the missing inductive proof steps for natural-number addition commutativity and compile the verified theorem.",
    ["bug repair", "test and validation"],
    ["Coq"],
    ["Coq"],
    ["formal proof", "proof compiler"],
    ["completed plus_comm.v", "plus_comm.vo"],
    ["prove forall n m : nat, n + m = m + n", "complete the existing induction-based argument", "compile successfully with coqc"],
  ),
  "pypi-server": p(
    "Host an installable vectorops package",
    "Create vectorops 0.1.0 with a dot-product API and host it on a local simple-package index reachable by pip on port 8080.",
    ["feature implementation", "systems setup", "test and validation"],
    ["Python packaging", "PyPI", "pip", "HTTP"],
    ["Python"],
    ["Python package", "package index", "HTTP server"],
    ["vectorops 0.1.0 package", "local PyPI service on port 8080"],
    ["export dotproduct from vectorops/__init__.py", "build version 0.1.0", "serve a pip-compatible /simple index", "support installation with the specified --index-url command"],
  ),
  "pytorch-model-cli": p(
    "Run MNIST PyTorch inference from a C CLI",
    "Convert the supplied PyTorch model weights to JSON and implement a command-line executable that predicts one MNIST digit from an image.",
    ["data transformation", "feature implementation"],
    ["PyTorch", "MNIST", "JSON", "PNG"],
    ["C", "Python", "JSON"],
    ["model weights", "inference runtime", "command-line interface"],
    ["/app/cli_tool", "/app/weights.json", "/app/prediction.txt"],
    ["invoke as ./cli_tool weights.json image.png", "load model parameters from weights.json", "print only one digit from 0 through 9", "store only the predicted digit in prediction.txt"],
  ),
  "pytorch-model-recovery": p(
    "Recover and tune a PyTorch model architecture",
    "Reconstruct the network represented by a state dictionary, freeze all but output_layer, improve dataset MSE, and export the result as TorchScript.",
    ["feature implementation", "model training", "test and validation"],
    ["PyTorch", "TorchScript", "transformers"],
    ["Python"],
    ["model architecture", "state dictionary", "training loop"],
    ["/app/model.pt"],
    ["define RecoveredModel to match /app/weights.pt exactly", "leave /app/weights.pt unchanged", "modify only output_layer parameters", "reduce MSE on /app/dataset.pt", "save a TorchScript model compatible with the original state dictionary"],
  ),
  "qemu-alpine-ssh": p(
    "Boot Alpine in QEMU with SSH access",
    "Run the supplied Alpine ISO in QEMU and configure a password-authenticated root SSH shell forwarded to localhost port 2222.",
    ["systems setup", "configuration tuning"],
    ["QEMU", "Alpine Linux", "OpenSSH", "TCP"],
    ["ISO disk image"],
    ["virtual machine", "SSH service", "host networking"],
    ["running Alpine VM", "reachable SSH service"],
    ["boot /app/alpine.iso", "forward host port 2222 to guest SSH", "allow root login with password password123", "drop successful clients into a shell"],
  ),
  "qemu-startup": p(
    "Expose an Alpine QEMU console over Telnet",
    "Boot the supplied Alpine ISO in a background QEMU process and expose its ready login console over Telnet on localhost port 6665.",
    ["systems setup", "configuration tuning"],
    ["QEMU", "Alpine Linux", "Telnet"],
    ["ISO disk image"],
    ["virtual machine", "serial console", "network service"],
    ["running Alpine VM", "Telnet-accessible login console"],
    ["boot /app/alpine.iso in the background", "listen at 127.0.0.1:6665", "block setup until the login prompt is ready", "leave the VM running"],
  ),
  "query-optimize": p(
    "Optimize an Open English WordNet SQL query",
    "Rewrite the supplied SQLite query for maximum efficiency while preserving its exact result against the immutable OEWN database.",
    ["performance optimization", "data transformation", "test and validation"],
    ["SQLite", "Open English WordNet", "SQL"],
    ["SQL"],
    ["database query", "query plan"],
    ["/app/sol.sql"],
    ["preserve the exact output of /app/my-sql-query.sql", "leave /app/oewn.sqlite unchanged", "use SQLite syntax", "write one comment-free query terminated by a semicolon"],
  ),
  "raman-fitting": p(
    "Fit Raman G and 2D peaks",
    "Fit Lorentzian models to the graphene spectrum's G and 2D peaks and export each peak's center, width, amplitude, and offset.",
    ["data transformation", "configuration tuning"],
    ["Raman spectroscopy", "Lorentzian fitting", "JSON"],
    ["JSON", "Python"],
    ["spectral data", "curve fitting"],
    ["/app/results.json"],
    ["fit both G and 2D peaks", "report x0, gamma, amplitude, and offset for each", "use the exact nested JSON structure requested"],
  ),
  "regex-chess": p(
    "Generate legal chess positions with regex substitutions",
    "Encode a complete white move generator as ordered regex replacements that transforms FEN into every legal successor position.",
    ["feature implementation"],
    ["regular expressions", "chess", "FEN", "JSON"],
    ["regular expressions", "JSON", "Python"],
    ["move generator", "position notation"],
    ["/app/re.json"],
    ["support castling with rights tracking, en passant, and queen-only promotion", "handle only white-to-move inputs", "emit every legal next FEN through the supplied re.sub loop", "stay below 100,000 pairs and 10MB"],
  ),
  "regex-log": p(
    "Match the last valid date on IPv4 log lines",
    "Write one Python-compatible multiline regex that returns only the last valid date from each line containing a boundary-safe IPv4 address.",
    ["feature implementation", "data transformation"],
    ["regular expressions", "IPv4", "log files"],
    ["regular expressions", "Python"],
    ["log parser", "pattern matching"],
    ["/app/regex.txt"],
    ["match YYYY-MM-DD with valid month and day ranges and February up to 29", "require a valid dotted-decimal IPv4 address without octet leading zeros", "exclude date and address tokens adjacent to alphanumerics", "return only the last date per qualifying line under re.MULTILINE"],
  ),
  "reshard-c4-data": p(
    "Reshard and restore C4 dataset directories",
    "Implement reversible dataset resharding that caps directory fanout and file size, recreates the original tree exactly, and runs through a locked uv environment.",
    ["data transformation", "systems setup", "test and validation"],
    ["C4 dataset", "uv", "Python packaging"],
    ["Python", "TOML"],
    ["filesystem", "dataset shards", "dependency environment"],
    ["/app/compress.py", "/app/decompress.py", "/app/pyproject.toml", "uv virtual environment"],
    ["limit every directory to 30 entries", "limit every output file to 15MB", "create missing output directories", "restore original paths and bytes in place", "ensure uv sync installs all dependencies and uv run adds none"],
  ),
  "rstan-to-pystan": p(
    "Port an RStan Gaussian process to PyStan",
    "Translate the supplied RStan Gaussian-process analysis to PyStan 3.10.0 with equivalent model, data, hyperparameters, sampling, and posterior summaries.",
    ["feature implementation", "systems setup", "data transformation"],
    ["PyStan 3.10.0", "Stan", "Gaussian processes"],
    ["Python", "R", "Stan", "CSV", "JSON"],
    ["probabilistic model", "sampling pipeline", "posterior estimates"],
    ["/app/pystan_analysis.py", "/app/alpha_est.csv", "/app/sigma_est.csv", "/app/rho_est.csv", "/app/beta_est.csv"],
    ["use PyStan 3.10.0 without R, RStan, cmdstanr, or cmdstanpy", "preserve the source model and sampling hyperparameters", "set random_seed=1 in stan.build", "write scalar alpha and sigma means and three-row rho and beta means as numeric CSV values"],
  ),
  "sam-cell-seg": p(
    "Refine cell boxes into MobileSAM contours",
    "Implement a CPU MobileSAM pipeline that converts every rectangular or polygonal cell annotation into one nonoverlapping contiguous polyline and updates its geometry fields.",
    ["feature implementation", "data transformation"],
    ["MobileSAM", "PyTorch", "OpenCV", "pandas", "histopathology"],
    ["Python", "CSV"],
    ["segmentation pipeline", "cell masks", "command-line interface"],
    ["/app/convert_masks.py", "refined mask CSV"],
    ["accept weights, output, RGB, and CSV paths through argparse", "use MobileSAM rather than original SAM", "run without a GPU or source modifications", "refine every row to one contiguous nonrectangular polyline", "prevent overlap and update only geometry columns while preserving the CSV schema"],
  ),
  "sanitize-git-repo": p(
    "Replace secrets in the dclm repository",
    "Find API credentials in the repository and replace each with a consistent service-specific placeholder without changing uncontaminated files.",
    ["security remediation"],
    ["Git", "AWS credentials", "GitHub tokens", "Hugging Face tokens"],
    ["Git repository format"],
    ["repository files", "secret values"],
    ["sanitized dclm repository"],
    ["replace AWS access IDs, AWS secret keys, GitHub tokens, and Hugging Face tokens with the prescribed placeholders", "remove every original sensitive value", "use consistent placeholders across files", "leave uncontaminated files unchanged"],
  ),
  "schemelike-metacircular-eval": p(
    "Implement a self-interpreting Scheme evaluator",
    "Write a Scheme metacircular evaluator for the supplied language that runs all programs, forwards remaining input and output, and can interpret itself recursively.",
    ["feature implementation", "test and validation"],
    ["Scheme", "metacircular evaluation"],
    ["Scheme", "Python"],
    ["language interpreter", "standard input and output"],
    ["eval.scm"],
    ["read exactly one program path line before forwarding remaining input", "match interp.py semantics for every program under test/", "send interpreted output to standard output", "support eval.scm interpreting another eval.scm"],
  ),
  "sparql-university": p(
    "Query eligible EU university professors",
    "Write a SPARQL query returning full professors who currently work in an EU university department with more than ten enrolled students.",
    ["data transformation"],
    ["SPARQL", "RDF", "Turtle", "ISO 3166-1"],
    ["SPARQL", "Turtle"],
    ["knowledge graph", "query aggregation"],
    ["/app/solution.sparql"],
    ["use 2025-08-16 for current-state and EU membership logic", "require at least one qualifying EU department with over ten students enrolled in its classes", "select full professors only", "return professorName and distinct working countries joined with comma-space"],
  ),
  "sqlite-db-truncate": p(
    "Recover rows from a truncated SQLite database",
    "Recover as many records as possible from the binary-truncated SQLite file and serialize each word and numeric value to JSON.",
    ["data recovery", "data transformation"],
    ["SQLite", "JSON", "binary file analysis"],
    ["JSON"],
    ["database file", "record pages"],
    ["/app/recover.json"],
    ["analyze /app/trunc.db without relying on normal intact-database access", "maximize the number of correctly recovered rows", "serialize objects with word and value fields"],
  ),
  "sqlite-with-gcov": p(
    "Build gcov-instrumented SQLite",
    "Compile the pre-vendored SQLite source with gcov instrumentation and make the resulting command-line tool available on PATH.",
    ["systems setup", "configuration tuning", "test and validation"],
    ["SQLite", "gcov", "GCC"],
    ["C"],
    ["build system", "coverage instrumentation", "system PATH"],
    ["/app/sqlite source tree", "gcov-instrumented sqlite executable"],
    ["use /app/vendor/sqlite-fossil-release.tar.gz rather than network sources", "build under /app/sqlite", "enable gcov instrumentation", "make sqlite invocable through PATH"],
  ),
  "torch-pipeline-parallelism": p(
    "Implement AFAB pipeline parallelism for LLaMA",
    "Implement one LLaMA training step that balances layers across ranks and executes all microbatch forwards before all backwards with correct distributed tensors.",
    ["feature implementation", "performance optimization", "test and validation"],
    ["PyTorch", "torch.distributed", "LLaMA", "pipeline parallelism"],
    ["Python"],
    ["distributed training", "model layers", "tensor communication"],
    ["/app/pipeline_parallel.py"],
    ["export train_step_pipeline_afab with the specified signature", "partition layers roughly evenly for world sizes one and two", "perform every forward before any backward", "communicate hidden states and gradients with the specified shapes", "compute and microbatch-scale cross-entropy on the last rank without hooks"],
  ),
  "torch-tensor-parallelism": p(
    "Implement row and column tensor-parallel linear layers",
    "Implement distributed PyTorch linear layers with correct master-weight sharding, collective-style outputs, zero bias initialization, and gradient behavior.",
    ["feature implementation", "performance optimization", "test and validation"],
    ["PyTorch", "torch.distributed", "tensor parallelism"],
    ["Python"],
    ["distributed linear layers", "weight shards", "gradient computation"],
    ["/app/parallel_linear.py"],
    ["export ColumnParallelLinear and RowParallelLinear with the specified constructors", "shard column weights and bias by output dimension then concatenate outputs", "shard row weights by input dimension then sum partial outputs while keeping full bias", "split the initialized master weight by rank", "support world sizes one, two, and four with correct gradients"],
  ),
  "train-fasttext": p(
    "Train a compact Yelp FastText classifier",
    "Train a FastText text classifier on the supplied Yelp reviews that exceeds 0.62 held-out accuracy while keeping the model under 150MB.",
    ["model training", "configuration tuning", "test and validation"],
    ["FastText", "Yelp reviews"],
    ["FastText binary format"],
    ["training dataset", "text classifier"],
    ["/app/model.bin"],
    ["train on the data directory's Yelp examples", "achieve at least 0.62 accuracy on same-distribution private data", "keep model.bin below 150MB"],
  ),
  "tune-mjcf": p(
    "Accelerate a MuJoCo model without changing physics",
    "Tune the MJCF model so a two-second simulation runs in at most 60 percent of the reference time while reaching the same finite physics state.",
    ["performance optimization", "configuration tuning", "test and validation"],
    ["MuJoCo", "MJCF", "XML"],
    ["XML", "Python"],
    ["simulation model", "physics state"],
    ["/app/model.xml"],
    ["leave /app/model_ref.xml unchanged", "simulate two seconds in no more than 60% of reference time", "match the full state within atol 1e-5", "produce no NaN or Inf and preserve physical properties"],
  ),
  "video-processing": p(
    "Detect hurdle takeoff and landing frames",
    "Implement an OpenCV script that analyzes a stationary-camera hurdle video and records the single jump's takeoff and landing frame numbers in TOML.",
    ["feature implementation", "data transformation"],
    ["OpenCV", "NumPy", "MP4", "TOML"],
    ["Python", "TOML"],
    ["video analysis", "motion events", "command-line interface"],
    ["/app/jump_analyzer.py", "/app/output.toml"],
    ["use only toml, cv2, and numpy", "accept an MP4 input and generalize beyond the example", "assume a fixed camera and empty first frame", "write exactly jump_takeoff_frame_number and jump_land_frame_number as integers"],
  ),
  "vulnerable-secret": p(
    "Extract a hidden flag from a vulnerable executable",
    "Analyze and interact with the supplied executable to recover its FLAG-formatted secret and save the exact value.",
    ["security assessment", "data recovery"],
    ["binary analysis", "memory corruption"],
    ["plain text"],
    ["native executable", "authentication boundary"],
    ["/app/results.txt"],
    ["recover the program's hidden key", "match the format FLAG{...}", "write the exact flag to /app/results.txt"],
  ),
  "winning-avg-corewars": p(
    "Write a Core War warrior with target win rates",
    "Create a Redcode warrior that meets separate 100-round win-rate thresholds against five supplied pMARS opponents without modifying them.",
    ["feature implementation", "configuration tuning", "test and validation"],
    ["pMARS", "Core War", "Redcode"],
    ["Redcode"],
    ["game program", "battle simulator"],
    ["my_warrior.red"],
    ["use core size 8000 and maximum 80,000 cycles", "win at least 75 of 100 rounds against stone, vampire, and paper", "win at least 33 of 100 rounds against snake and g2-clear", "leave every opponent file unchanged"],
  ),
  "write-compressor": p(
    "Create data for a custom decompressor",
    "Reverse-engineer the supplied decompression format and produce a compact file that expands byte-for-byte to data.txt.",
    ["data transformation", "feature implementation"],
    ["custom compression"],
    ["C"],
    ["binary format", "compressed data"],
    ["data.comp"],
    ["make /app/decomp reproduce /app/data.txt exactly", "keep data.comp at or below 2,500 bytes", "do not require changes to the supplied decompressor"],
  ),
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathExists(path) {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function sourceHead() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: SOURCE_DIR,
    encoding: "utf8",
  }).trim();
}

function caseTree(nativeId) {
  return execFileSync(
    "git",
    ["rev-parse", `${REVISION}:tasks/${nativeId}`],
    { cwd: SOURCE_DIR, encoding: "utf8" },
  ).trim();
}

function parseMetadata(taskToml, nativeId) {
  const section = taskToml.match(/\n\[metadata\]\n([\s\S]*?)(?=\n\[|$)/)?.[1];
  assert(section, `Missing metadata section for ${nativeId}`);
  const scalar = (name) =>
    section.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"`, "m"))?.[1];
  const tagsSource = section.match(/^tags\s*=\s*(\[[^\n]*\])/m)?.[1];
  const category = scalar("category");
  const difficulty = scalar("difficulty");
  assert(category && difficulty && tagsSource, `Incomplete metadata for ${nativeId}`);
  const tags = JSON.parse(tagsSource);
  return {
    category,
    difficulty,
    ...(tags.length > 0 ? { tags: tags.join(", ") } : {}),
  };
}

function decodeNextFlight(html) {
  return [
    ...html.matchAll(
      /<script>self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)<\/script>/g,
    ),
  ]
    .map((match) => JSON.parse(match[1]))
    .join("");
}

function extractJsonObject(text, marker) {
  const markerIndex = text.indexOf(marker);
  assert(markerIndex !== -1, `Missing ${marker}`);
  const start = text.indexOf("{", markerIndex + marker.length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      return JSON.parse(text.slice(start, index + 1));
    }
  }
  throw new Error(`Unterminated JSON object after ${marker}`);
}

function parseHarborTrials(html) {
  return extractJsonObject(decodeNextFlight(html), '"initialTrials":');
}

async function fetchText(url) {
  let finalError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "text/html",
          "user-agent": "justenough-terminal-bench-extractor/1.0",
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.text();
    } catch (error) {
      finalError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw new Error(`Unable to fetch ${url}: ${finalError.message}`);
}

async function cachedHarborPage(jobId, page) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = join(CACHE_DIR, `${jobId}-${page}.html`);
  if (await pathExists(cachePath)) return readFile(cachePath, "utf8");
  const suffix = page === 1 ? "" : `?page=${page}`;
  const html = await fetchText(`https://hub.harborframework.com/jobs/${jobId}${suffix}`);
  await writeFile(cachePath, html);
  return html;
}

async function mapLimit(values, limit, callback) {
  const result = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await callback(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return result;
}

async function loadHarborJob(jobId) {
  const first = parseHarborTrials(await cachedHarborPage(jobId, 1));
  const pageNumbers = Array.from({ length: first.total_pages - 1 }, (_, index) => index + 2);
  const rest = await mapLimit(pageNumbers, 4, async (page) =>
    parseHarborTrials(await cachedHarborPage(jobId, page)),
  );
  const trials = [first, ...rest].flatMap((page) => page.items);
  assert(trials.length === first.total, `Harbor job ${jobId}: expected ${first.total}, found ${trials.length}`);
  return trials.map((trial) => ({ ...trial, __jobId: jobId }));
}

function classifyTrial(trial, disqualified) {
  if (disqualified.has(trial.id)) return "disqualified";
  if (trial.error_type || trial.hosted_error || trial.status !== "completed") return "errored";
  return Number(trial.reward) > 0 ? "passed" : "failed";
}

function fallbackProvider(model) {
  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("glm-")) return "zai";
  return "unknown";
}

function buildOutcome({ path, submission, trials }, nativeId) {
  const selected = trials.filter((trial) => trial.task_name?.split("/").at(-1) === nativeId);
  const selectedIds = new Set(selected.map((trial) => trial.id));
  const disqualified = new Set(
    (submission.disqualified_trials ?? [])
      .map((item) => item.trial_id)
      .filter((trialId) => selectedIds.has(trialId)),
  );
  const counts = { passed: 0, failed: 0, errored: 0, excluded: 0, disqualified: 0 };
  for (const trial of selected) {
    const state = classifyTrial(trial, disqualified);
    if (state === "disqualified") {
      counts.disqualified += 1;
      counts.failed += 1;
    } else counts[state] += 1;
  }

  const first = selected[0];
  assert(first, `${path} has no trial for ${nativeId}`);
  const sourceParts = submission.source_filter.model_name.split("/");
  const sourceProvider = sourceParts.length > 1 ? sourceParts.shift() : undefined;
  const sourceModel = sourceParts.join("/") || submission.source_filter.model_name;
  const observedProvider = first.model_provider;
  const jobId = first.__jobId;
  assert(submission.source_jobs.includes(jobId), `${path}: unmatched Harbor job for ${nativeId}`);

  return {
    provider:
      observedProvider && observedProvider !== "unknown"
        ? observedProvider
        : sourceProvider ?? fallbackProvider(first.model_name ?? sourceModel),
    model: first.model_name ?? sourceModel,
    harness: submission.source_filter.agent,
    ...(submission.source_filter.agent_version
      ? { harness_version: submission.source_filter.agent_version }
      : {}),
    configuration: basename(path, ".json"),
    ...(submission.metadata.date ? { submission_date: submission.metadata.date } : {}),
    effort: submission.source_filter.reasoning_effort ?? "default",
    attempts: selected.length,
    ...counts,
    source_job_url: `https://hub.harborframework.com/jobs/${jobId}`,
    source_submission_url: `${REPOSITORY}/blob/${REVISION}/${path}`,
  };
}

async function loadSubmissions() {
  const submissionsDir = join(SOURCE_DIR, "leaderboard/submissions");
  const paths = execFileSync("find", [submissionsDir, "-maxdepth", "1", "-type", "f", "-name", "*.json"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((absolute) => `leaderboard/submissions/${basename(absolute)}`)
    .sort();
  assert(paths.length === 20, `Expected 20 submissions, found ${paths.length}`);
  const values = await Promise.all(
    paths.map(async (path) => ({ path, submission: JSON.parse(await readFile(join(SOURCE_DIR, path), "utf8")) })),
  );
  const references = values.reduce((sum, item) => sum + item.submission.trials.length, 0);
  assert(references === 8902, `Expected 8,902 curated trial references, found ${references}`);
  return values;
}

async function attachTrials(submissions) {
  const jobIds = [...new Set(submissions.flatMap((item) => item.submission.source_jobs))].sort();
  const jobs = new Map();
  const loaded = await mapLimit(jobIds, 3, async (jobId) => [jobId, await loadHarborJob(jobId)]);
  for (const [jobId, trials] of loaded) jobs.set(jobId, trials);

  return submissions.map((item) => {
    const available = item.submission.source_jobs.flatMap((jobId) => jobs.get(jobId) ?? []);
    const byId = new Map(available.map((trial) => [trial.id, trial]));
    const missing = item.submission.trials.filter((trialId) => !byId.has(trialId));
    assert(missing.length === 0, `${item.path}: ${missing.length} curated trial IDs unresolved`);
    return { ...item, trials: item.submission.trials.map((trialId) => byId.get(trialId)) };
  });
}

function validate(records, taskIds) {
  assert(records.length === 89, `Expected 89 records, found ${records.length}`);
  assert(JSON.stringify(records.map((record) => record.identity.native_id)) === JSON.stringify(taskIds), "Records are not sorted by native ID");
  const identities = new Set();
  const configurations = new Set();
  const models = new Set();
  let attempts = 0;
  for (const record of records) {
    const id = record.identity.native_id;
    assert(!identities.has(id), `Duplicate identity ${id}`);
    identities.add(id);
    assert(record.revision.case_tree === caseTree(id), `Case tree mismatch for ${id}`);
    const profile = record.profile;
    for (const field of ["title", "summary", "description", "interaction"]) assert(profile[field], `${id}: empty ${field}`);
    for (const field of ["intents", "technologies", "work_surfaces", "expected_artifacts", "difficulty_factors"]) {
      assert(Array.isArray(profile[field]) && profile[field].length > 0, `${id}: empty ${field}`);
    }
    assert(record.outcomes.panel.length === 20, `${id}: expected 20 panel rows`);
    assert(new Set(record.outcomes.panel.map((row) => row.configuration)).size === 20, `${id}: duplicate configuration`);
    for (const row of record.outcomes.panel) {
      for (const field of ["attempts", "passed", "failed", "errored", "excluded", "disqualified"]) {
        assert(Number.isInteger(row[field]) && row[field] >= 0, `${id}/${row.configuration}: invalid ${field}`);
      }
      assert(row.attempts === row.passed + row.failed + row.errored + row.excluded, `${id}/${row.configuration}: count equation failed`);
      configurations.add(row.configuration);
      models.add(row.model);
      attempts += row.attempts;
    }
  }
  assert(configurations.size === 20, `Expected 20 configurations, found ${configurations.size}`);
  assert(models.size === 13, `Expected 13 models, found ${models.size}`);
  assert(attempts === 8902, `Expected 8,902 attempts, found ${attempts}`);
  return { records: records.length, configurations: configurations.size, models: models.size, trials: attempts };
}

async function main() {
  assert(sourceHead() === REVISION, `Source HEAD must equal ${REVISION}`);
  const taskIds = execFileSync("find", [join(SOURCE_DIR, "tasks"), "-mindepth", "1", "-maxdepth", "1", "-type", "d"], {
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((path) => basename(path))
    .sort();
  assert(taskIds.length === 89, `Expected 89 task directories, found ${taskIds.length}`);
  assert(Object.keys(profiles).length === 89, `Expected 89 semantic profiles, found ${Object.keys(profiles).length}`);
  assert(taskIds.every((id) => profiles[id]), "Semantic profile IDs do not match source tasks");

  const submissions = await attachTrials(await loadSubmissions());
  const records = await Promise.all(
    taskIds.map(async (nativeId) => {
      const taskDir = join(SOURCE_DIR, "tasks", nativeId);
      const taskToml = await readFile(join(taskDir, "task.toml"), "utf8");
      await readFile(join(taskDir, "instruction.md"), "utf8");
      const panel = submissions
        .map((submission) => buildOutcome(submission, nativeId))
        .sort((a, b) => a.configuration.localeCompare(b.configuration));
      return {
        schema_version: "1",
        identity: { benchmark: "terminal-bench", release: "2.1", native_id: nativeId },
        revision: {
          source_revision: REVISION,
          case_tree: caseTree(nativeId),
          source_url: `${REPOSITORY}/blob/${REVISION}/tasks/${nativeId}/task.toml`,
        },
        profile: { ...profiles[nativeId], observed_labels: parseMetadata(taskToml, nativeId) },
        outcomes: {
          source_url: `${REPOSITORY}/tree/${REVISION}/leaderboard/submissions`,
          published_configurations: 20,
          published_trials: panel.reduce((sum, row) => sum + row.attempts, 0),
          panel,
        },
        extraction: {
          method: "frontier LLM semantic extraction with pinned-source review",
          version: "full-2",
          date: EXTRACTION_DATE,
          observed_fields: ["identity", "revision", "profile.observed_labels", "outcomes"],
          derived_fields: [
            "profile.title",
            "profile.summary",
            "profile.description",
            "profile.interaction",
            "profile.intents",
            "profile.technologies",
            "profile.languages",
            "profile.work_surfaces",
            "profile.expected_artifacts",
            "profile.difficulty_factors",
          ],
          omitted: [
            "instruction text",
            "environment implementation",
            "author contact",
            "solution",
            "verifier",
            "tests",
            "trajectories",
            "patches",
            "logs",
          ],
        },
      };
    }),
  );

  const report = validate(records, taskIds);
  await mkdir(new URL("../corpus/", import.meta.url), { recursive: true });
  await writeFile(OUTPUT, `${records.map(JSON.stringify).join("\n")}\n`);
  console.log(JSON.stringify({ output: OUTPUT.pathname, source_revision: REVISION, ...report }, null, 2));
}

await main();
