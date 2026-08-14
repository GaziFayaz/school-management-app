using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db, IWebHostEnvironment? env = null)
    {
        await db.Database.MigrateAsync();

        // If the database is empty or contains only legacy minimal seed data (<= 3 users and 0 submissions), re-seed with rich data.
        var userCount = await db.Users.CountAsync();
        var submissionCount = await db.Submissions.CountAsync();

        if (userCount > 3 && submissionCount > 0)
        {
            // Already seeded with rich dataset
            return;
        }

        if (userCount <= 3)
        {
            // Clean up any legacy partial data
            db.Submissions.RemoveRange(db.Submissions);
            db.Assignments.RemoveRange(db.Assignments);
            db.ClassStudents.RemoveRange(db.ClassStudents);
            db.ClassSubjectTeachers.RemoveRange(db.ClassSubjectTeachers);
            db.Subjects.RemoveRange(db.Subjects);
            db.Classes.RemoveRange(db.Classes);
            db.Users.RemoveRange(db.Users);
            await db.SaveChangesAsync();
        }

        var now = DateTime.UtcNow;

        // ==========================================
        // 1. SEED USERS (Admins, Teachers, Students)
        // ==========================================
        var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var teacherPasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher@123");
        var studentPasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123");

        // Primary Demo Accounts (Preserved)
        var admin = new User { Name = "System Administrator", Email = "admin@school.com", PasswordHash = adminPasswordHash, Role = UserRole.Admin, CreatedAt = now.AddMonths(-6) };
        var teacherSarah = new User { Name = "Sarah Jenkins", Email = "teacher@school.com", PasswordHash = teacherPasswordHash, Role = UserRole.Teacher, CreatedAt = now.AddMonths(-6) };
        var studentAlex = new User { Name = "Alex Rivera", Email = "student@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };

        // Additional Admins
        var adminRobert = new User { Name = "Prof. Robert Langdon", Email = "robert.langdon@school.com", PasswordHash = adminPasswordHash, Role = UserRole.Admin, CreatedAt = now.AddMonths(-6) };

        // Additional Teachers
        var teacherMarcus = new User { Name = "Dr. Marcus Vance", Email = "marcus.vance@school.com", PasswordHash = teacherPasswordHash, Role = UserRole.Teacher, CreatedAt = now.AddMonths(-6) };
        var teacherElena = new User { Name = "Elena Rostova", Email = "elena.rostova@school.com", PasswordHash = teacherPasswordHash, Role = UserRole.Teacher, CreatedAt = now.AddMonths(-6) };
        var teacherDavid = new User { Name = "David Kim", Email = "david.kim@school.com", PasswordHash = teacherPasswordHash, Role = UserRole.Teacher, CreatedAt = now.AddMonths(-6) };
        var teacherClara = new User { Name = "Clara Oswald", Email = "clara.oswald@school.com", PasswordHash = teacherPasswordHash, Role = UserRole.Teacher, CreatedAt = now.AddMonths(-6) };

        // Additional Students
        var studentEmma = new User { Name = "Emma Watson", Email = "emma.watson@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentLiam = new User { Name = "Liam Chen", Email = "liam.chen@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentSophia = new User { Name = "Sophia Martinez", Email = "sophia.martinez@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentNoah = new User { Name = "Noah Patel", Email = "noah.patel@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentOlivia = new User { Name = "Olivia Taylor", Email = "olivia.taylor@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentLucas = new User { Name = "Lucas Silva", Email = "lucas.silva@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentMaya = new User { Name = "Maya Lin", Email = "maya.lin@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentEthan = new User { Name = "Ethan Hunt", Email = "ethan.hunt@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };
        var studentAva = new User { Name = "Ava Dubois", Email = "ava.dubois@school.com", PasswordHash = studentPasswordHash, Role = UserRole.Student, CreatedAt = now.AddMonths(-5) };

        db.Users.AddRange(
            admin, adminRobert,
            teacherSarah, teacherMarcus, teacherElena, teacherDavid, teacherClara,
            studentAlex, studentEmma, studentLiam, studentSophia, studentNoah,
            studentOlivia, studentLucas, studentMaya, studentEthan, studentAva
        );
        await db.SaveChangesAsync();

        // ==========================================
        // 2. SEED CLASSES (6 Distinct Sections)
        // ==========================================
        var clsGrade10A = new Class { Name = "Grade 10-A", GradeLevel = "Grade 10", CreatedAt = now.AddMonths(-6) };
        var clsGrade10B = new Class { Name = "Grade 10-B", GradeLevel = "Grade 10", CreatedAt = now.AddMonths(-6) };
        var clsGrade11Sci = new Class { Name = "Grade 11-Science", GradeLevel = "Grade 11", CreatedAt = now.AddMonths(-6) };
        var clsGrade11Com = new Class { Name = "Grade 11-Commerce", GradeLevel = "Grade 11", CreatedAt = now.AddMonths(-6) };
        var clsGrade12Sci = new Class { Name = "Grade 12-Science", GradeLevel = "Grade 12", CreatedAt = now.AddMonths(-6) };
        var clsGrade9A = new Class { Name = "Grade 9-A", GradeLevel = "Grade 9", CreatedAt = now.AddMonths(-6) };

        db.Classes.AddRange(clsGrade10A, clsGrade10B, clsGrade11Sci, clsGrade11Com, clsGrade12Sci, clsGrade9A);
        await db.SaveChangesAsync();

        // ==========================================
        // 3. SEED SUBJECTS (8 Academic Subjects)
        // ==========================================
        var subMath = new Subject { Name = "Mathematics & Geometry", Code = "MATH101", CreatedAt = now.AddMonths(-6) };
        var subCS = new Subject { Name = "Computer Science & Algorithms", Code = "CS101", CreatedAt = now.AddMonths(-6) };
        var subPhys = new Subject { Name = "Advanced Physics & Mechanics", Code = "PHYS101", CreatedAt = now.AddMonths(-6) };
        var subChem = new Subject { Name = "Chemistry & Molecular Science", Code = "CHEM101", CreatedAt = now.AddMonths(-6) };
        var subBio = new Subject { Name = "Biology & Genetics", Code = "BIO101", CreatedAt = now.AddMonths(-6) };
        var subEng = new Subject { Name = "English Literature & Composition", Code = "ENG101", CreatedAt = now.AddMonths(-6) };
        var subHist = new Subject { Name = "World History & Civics", Code = "HIST101", CreatedAt = now.AddMonths(-6) };
        var subEcon = new Subject { Name = "Economics & Financial Literacy", Code = "ECON101", CreatedAt = now.AddMonths(-6) };

        db.Subjects.AddRange(subMath, subCS, subPhys, subChem, subBio, subEng, subHist, subEcon);
        await db.SaveChangesAsync();

        // ==========================================
        // 4. SEED TEACHER ALLOCATIONS
        // ==========================================
        var allocations = new List<ClassSubjectTeacher>
        {
            // Sarah Jenkins (teacher@school.com)
            new() { ClassId = clsGrade10A.Id, SubjectId = subMath.Id, TeacherId = teacherSarah.Id },
            new() { ClassId = clsGrade10A.Id, SubjectId = subCS.Id, TeacherId = teacherSarah.Id },
            new() { ClassId = clsGrade10B.Id, SubjectId = subMath.Id, TeacherId = teacherSarah.Id },
            new() { ClassId = clsGrade11Sci.Id, SubjectId = subCS.Id, TeacherId = teacherSarah.Id },

            // Dr. Marcus Vance
            new() { ClassId = clsGrade10A.Id, SubjectId = subPhys.Id, TeacherId = teacherMarcus.Id },
            new() { ClassId = clsGrade11Sci.Id, SubjectId = subPhys.Id, TeacherId = teacherMarcus.Id },
            new() { ClassId = clsGrade12Sci.Id, SubjectId = subPhys.Id, TeacherId = teacherMarcus.Id },

            // Elena Rostova
            new() { ClassId = clsGrade10A.Id, SubjectId = subChem.Id, TeacherId = teacherElena.Id },
            new() { ClassId = clsGrade10A.Id, SubjectId = subBio.Id, TeacherId = teacherElena.Id },
            new() { ClassId = clsGrade11Sci.Id, SubjectId = subChem.Id, TeacherId = teacherElena.Id },

            // David Kim
            new() { ClassId = clsGrade10A.Id, SubjectId = subEng.Id, TeacherId = teacherDavid.Id },
            new() { ClassId = clsGrade10A.Id, SubjectId = subHist.Id, TeacherId = teacherDavid.Id },
            new() { ClassId = clsGrade9A.Id, SubjectId = subEng.Id, TeacherId = teacherDavid.Id },

            // Clara Oswald
            new() { ClassId = clsGrade11Com.Id, SubjectId = subEcon.Id, TeacherId = teacherClara.Id },
            new() { ClassId = clsGrade10B.Id, SubjectId = subEcon.Id, TeacherId = teacherClara.Id }
        };

        db.ClassSubjectTeachers.AddRange(allocations);
        await db.SaveChangesAsync();

        // ==========================================
        // 5. SEED STUDENT ENROLLMENTS
        // ==========================================
        var enrollments = new List<ClassStudent>
        {
            // Grade 10-A (Primary Cohort for Alex Rivera)
            new() { ClassId = clsGrade10A.Id, StudentId = studentAlex.Id },
            new() { ClassId = clsGrade10A.Id, StudentId = studentEmma.Id },
            new() { ClassId = clsGrade10A.Id, StudentId = studentLiam.Id },
            new() { ClassId = clsGrade10A.Id, StudentId = studentSophia.Id },
            new() { ClassId = clsGrade10A.Id, StudentId = studentNoah.Id },

            // Grade 10-B
            new() { ClassId = clsGrade10B.Id, StudentId = studentOlivia.Id },
            new() { ClassId = clsGrade10B.Id, StudentId = studentLucas.Id },
            new() { ClassId = clsGrade10B.Id, StudentId = studentLiam.Id },

            // Grade 11-Science (Alex also enrolled in Advanced STEM track)
            new() { ClassId = clsGrade11Sci.Id, StudentId = studentAlex.Id },
            new() { ClassId = clsGrade11Sci.Id, StudentId = studentMaya.Id },
            new() { ClassId = clsGrade11Sci.Id, StudentId = studentEthan.Id },
            new() { ClassId = clsGrade11Sci.Id, StudentId = studentEmma.Id },

            // Grade 11-Commerce
            new() { ClassId = clsGrade11Com.Id, StudentId = studentAva.Id },
            new() { ClassId = clsGrade11Com.Id, StudentId = studentLucas.Id },

            // Grade 12-Science
            new() { ClassId = clsGrade12Sci.Id, StudentId = studentEthan.Id },

            // Grade 9-A
            new() { ClassId = clsGrade9A.Id, StudentId = studentSophia.Id }
        };

        db.ClassStudents.AddRange(enrollments);
        await db.SaveChangesAsync();

        // ==========================================
        // 6. SEED ASSIGNMENTS (16 Rich Assignments)
        // ==========================================
        var asgMathAlgebra = new Assignment
        {
            Title = "Algebra & Quadratic Equations Problem Set",
            Description = "Complete all problems in Chapter 4 (Sections 4.1 to 4.5). Show complete step-by-step algebraic derivations for polynomial roots and factorizations. Submit your answers in clean PDF format.",
            Deadline = now.AddDays(-7),
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subMath.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-14),
            UpdatedAt = now.AddDays(-14)
        };

        var asgCSOop = new Assignment
        {
            Title = "OOP & Data Structures Lab: Polymorphism & Interfaces",
            Description = "Implement the shape hierarchy and sorting comparator interfaces in C#/Java. Include class architecture diagrams, clean source code snippets, and unit test execution screenshots in your PDF report.",
            Deadline = now.AddDays(-4),
            MaxMarks = 50m,
            ClassId = clsGrade10A.Id,
            SubjectId = subCS.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-12),
            UpdatedAt = now.AddDays(-12)
        };

        var asgPhysMechanics = new Assignment
        {
            Title = "Newtonian Mechanics & Orbital Dynamics Lab",
            Description = "Analyze planetary orbits using Kepler's laws and Newton's gravitational equations. Plot velocity vs time vectors and present your experimental uncertainty margins clearly.",
            Deadline = now.AddDays(-6),
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subPhys.Id,
            TeacherId = teacherMarcus.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-15),
            UpdatedAt = now.AddDays(-15)
        };

        var asgChemTitration = new Assignment
        {
            Title = "Chemical Equilibrium & Acid-Base Titration Report",
            Description = "Calculate equivalence points and buffer capacities from the lab experimental data. Include pH titration curves, indicator selection rationale, and error analysis calculations.",
            Deadline = now.AddDays(-10),
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subChem.Id,
            TeacherId = teacherElena.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-20),
            UpdatedAt = now.AddDays(-20)
        };

        var asgEngShakespeare = new Assignment
        {
            Title = "Literary Analysis: Shakespearean Themes in Modern Context",
            Description = "Write a 1,500-word comparative essay exploring existential dread and ambition in Macbeth versus contemporary drama. Provide minimum of 5 direct text citations with MLA bibliography.",
            Deadline = now.AddDays(-12),
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subEng.Id,
            TeacherId = teacherDavid.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-22),
            UpdatedAt = now.AddDays(-22)
        };

        var asgHistColdWar = new Assignment
        {
            Title = "Cold War Geopolitics & International Relations Research",
            Description = "Examine the ideological conflicts and proxy wars of the 1960s. Evaluate the effectiveness of deterrence doctrines and post-war diplomatic treaties.",
            Deadline = now.AddDays(-2), // Past deadline - Alex has NOT submitted -> Triggers Overdue status!
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subHist.Id,
            TeacherId = teacherDavid.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-10),
            UpdatedAt = now.AddDays(-10)
        };

        var asgMathCalculus = new Assignment
        {
            Title = "Calculus & Trigonometric Modeling Midterm Project",
            Description = "Model periodic waveforms and rate-of-change dynamics using differential calculus. Detail all integration techniques, boundary conditions, and graphical sketches.",
            Deadline = now.AddDays(3), // Urgent upcoming deadline (3 days remaining)
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subMath.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-5)
        };

        var asgCSRecursion = new Assignment
        {
            Title = "Python Algorithms: Recursion, Trees & Binary Search",
            Description = "Design and benchmark recursive tree traversal algorithms (Pre-order, In-order, Post-order). Provide asymptotic Big-O time and space complexity analysis.",
            Deadline = now.AddDays(7),
            MaxMarks = 50m,
            ClassId = clsGrade10A.Id,
            SubjectId = subCS.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-3),
            UpdatedAt = now.AddDays(-3)
        };

        var asgMathStats = new Assignment
        {
            Title = "Statistical Distributions & Probability Analysis",
            Description = "Perform hypothesis testing and normal distribution calculations on provided demographic datasets. Include confidence interval computations and z-scores.",
            Deadline = now.AddDays(14),
            MaxMarks = 75m,
            ClassId = clsGrade10A.Id,
            SubjectId = subMath.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-2),
            UpdatedAt = now.AddDays(-2)
        };

        var asgPhysThermo = new Assignment
        {
            Title = "Thermodynamics & Heat Transfer Calculations",
            Description = "Solve thermal conduction and entropy transformation problems in closed systems. Show all thermodynamic cycle derivations and enthalpy changes.",
            Deadline = now.AddDays(4),
            MaxMarks = 50m,
            ClassId = clsGrade10A.Id,
            SubjectId = subPhys.Id,
            TeacherId = teacherMarcus.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-4),
            UpdatedAt = now.AddDays(-4)
        };

        var asgBioGenetics = new Assignment
        {
            Title = "Cellular Respiration & DNA Synthesis Essay",
            Description = "Explain the enzymatic reactions of the Krebs cycle and oxidative phosphorylation. Diagram the transcription and translation phases of gene expression.",
            Deadline = now.AddDays(8),
            MaxMarks = 50m,
            ClassId = clsGrade10A.Id,
            SubjectId = subBio.Id,
            TeacherId = teacherElena.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-3),
            UpdatedAt = now.AddDays(-3)
        };

        var asgCSDatabase = new Assignment
        {
            Title = "Database Schema Design & 3NF Normalization",
            Description = "Design a relational ERD schema for an enterprise clinic management system. Normalize tables up to Third Normal Form (3NF) and write indexing optimization queries.",
            Deadline = now.AddDays(5),
            MaxMarks = 100m,
            ClassId = clsGrade11Sci.Id,
            SubjectId = subCS.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-6),
            UpdatedAt = now.AddDays(-6)
        };

        var asgPhysRelativity = new Assignment
        {
            Title = "Special Relativity & Lorentz Transformations",
            Description = "Derive time dilation and length contraction equations for relativistic velocities. Solve mass-energy equivalence collision problems.",
            Deadline = now.AddDays(10),
            MaxMarks = 100m,
            ClassId = clsGrade11Sci.Id,
            SubjectId = subPhys.Id,
            TeacherId = teacherMarcus.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-2),
            UpdatedAt = now.AddDays(-2)
        };

        var asgEconMicro = new Assignment
        {
            Title = "Microeconomics: Supply, Demand & Elasticity Modeling",
            Description = "Graph market equilibrium shifts under government price ceilings and tax subsidies. Calculate cross-price elasticity of demand and consumer surplus.",
            Deadline = now.AddDays(6),
            MaxMarks = 100m,
            ClassId = clsGrade11Com.Id,
            SubjectId = subEcon.Id,
            TeacherId = teacherClara.Id,
            Status = AssignmentStatus.Published,
            CreatedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-5)
        };

        var asgMathDiscreteDraft = new Assignment
        {
            Title = "Discrete Mathematics: Propositional Logic & Set Theory",
            Description = "Draft problem set covering truth tables, predicate calculus, mathematical induction proofs, and Venn diagram Boolean algebra.",
            Deadline = now.AddDays(20),
            MaxMarks = 50m,
            ClassId = clsGrade10A.Id,
            SubjectId = subMath.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Draft,
            CreatedAt = now.AddDays(-1),
            UpdatedAt = now.AddDays(-1)
        };

        var asgCSWebSecDraft = new Assignment
        {
            Title = "Web Application Security & JWT Authentication Lab",
            Description = "Draft workshop on implementing token-based authentication, password hashing with salt, and preventing cross-site scripting (XSS) vulnerabilities.",
            Deadline = now.AddDays(30),
            MaxMarks = 100m,
            ClassId = clsGrade10A.Id,
            SubjectId = subCS.Id,
            TeacherId = teacherSarah.Id,
            Status = AssignmentStatus.Draft,
            CreatedAt = now.AddDays(-1),
            UpdatedAt = now.AddDays(-1)
        };

        db.Assignments.AddRange(
            asgMathAlgebra, asgCSOop, asgPhysMechanics, asgChemTitration, asgEngShakespeare, asgHistColdWar,
            asgMathCalculus, asgCSRecursion, asgMathStats, asgPhysThermo, asgBioGenetics,
            asgCSDatabase, asgPhysRelativity, asgEconMicro,
            asgMathDiscreteDraft, asgCSWebSecDraft
        );
        await db.SaveChangesAsync();

        // ==========================================
        // 7. SEED SUBMISSIONS & GRADING (25+ Submissions)
        // ==========================================
        var submissions = new List<Submission>();
        var samplePdfFiles = new List<(string key, byte[] bytes)>();

        // Determine base storage directory
        var contentRoot = env?.ContentRootPath ?? Directory.GetCurrentDirectory();
        var storageSubmissionsDir = Path.Combine(contentRoot, "StorageUploads", "submissions");
        try
        {
            Directory.CreateDirectory(storageSubmissionsDir);
        }
        catch
        {
            // Directory creation fallback
        }

        Submission CreateSubmission(
            Assignment assignment,
            User student,
            Class cls,
            Subject subject,
            DateTime submittedAt,
            SubmissionStatus status,
            decimal? marks = null,
            string? feedback = null)
        {
            var cleanStudent = student.Name.ToLower().Replace(" ", "_");
            var cleanAsg = assignment.Title.ToLower().Split(' ')[0];
            var fileName = $"{cleanStudent}_{cleanAsg}_solution.pdf";
            var fileKey = $"submissions/{Guid.NewGuid()}.pdf";
            var fileUrl = $"/api/student/submissions/file?key={Uri.EscapeDataString(fileKey)}";
            var pdfBytes = BuildValidPdf(assignment.Title, student.Name, cls.Name, subject.Name, submittedAt);

            samplePdfFiles.Add((fileKey, pdfBytes));

            return new Submission
            {
                AssignmentId = assignment.Id,
                StudentId = student.Id,
                FileName = fileName,
                FileKey = fileKey,
                FileUrl = fileUrl,
                FileSize = pdfBytes.Length,
                SubmittedAt = submittedAt,
                Status = status,
                Marks = marks,
                Feedback = feedback,
                UpdatedAt = status == SubmissionStatus.Graded ? submittedAt.AddDays(1) : submittedAt
            };
        }

        // --- Alex Rivera (student@school.com) Submissions ---
        // 1. Graded: Algebra & Quadratic Equations (94.5 / 100)
        submissions.Add(CreateSubmission(asgMathAlgebra, studentAlex, clsGrade10A, subMath,
            now.AddDays(-8), SubmissionStatus.Graded, 94.50m,
            "Outstanding work on quadratic root derivations! Question 4 was solved with great mathematical elegance and clear algebraic proofs. Keep up the high standard!"));

        // 2. Graded: OOP & Data Structures Lab (48.0 / 50)
        submissions.Add(CreateSubmission(asgCSOop, studentAlex, clsGrade10A, subCS,
            now.AddDays(-5), SubmissionStatus.Graded, 48.00m,
            "Clean modular architecture, proper interface segregation, and solid unit test coverage. Excellent code structure and documentation!"));

        // 3. Graded: Newtonian Mechanics Lab (91.0 / 100)
        submissions.Add(CreateSubmission(asgPhysMechanics, studentAlex, clsGrade10A, subPhys,
            now.AddDays(-7), SubmissionStatus.Graded, 91.00m,
            "Accurate orbital velocity calculations and well-structured error margin graphs. Review section 3 air resistance assumptions for higher fidelity."));

        // 4. Graded: Chemical Equilibrium Report (88.5 / 100)
        submissions.Add(CreateSubmission(asgChemTitration, studentAlex, clsGrade10A, subChem,
            now.AddDays(-11), SubmissionStatus.Graded, 88.50m,
            "Well-documented titration curves and accurate molarity calculations. Great analysis of buffer solutions and indicator equilibria."));

        // 5. Graded: Literary Analysis (95.0 / 100)
        submissions.Add(CreateSubmission(asgEngShakespeare, studentAlex, clsGrade10A, subEng,
            now.AddDays(-13), SubmissionStatus.Graded, 95.00m,
            "Insightful comparative thesis with compelling textual evidence. Your analysis of Macbeth's soliloquies and modern existential themes was truly impressive."));

        // 6. Graded: Database Schema Design (96.0 / 100) (In Grade 11-Science)
        submissions.Add(CreateSubmission(asgCSDatabase, studentAlex, clsGrade11Sci, subCS,
            now.AddDays(-2), SubmissionStatus.Graded, 96.00m,
            "Comprehensive ERD modeling and flawless 3NF schema breakdown. Indexing strategies are well-targeted for high concurrency. Excellent!"));

        // 7. Submitted (Pending Teacher Grading): Calculus Midterm Project
        submissions.Add(CreateSubmission(asgMathCalculus, studentAlex, clsGrade10A, subMath,
            now.AddDays(-1), SubmissionStatus.Submitted));

        // Note: asgHistColdWar is NOT submitted by Alex Rivera -> Triggers Overdue status in Student Portal!

        // --- Emma Watson Submissions ---
        submissions.Add(CreateSubmission(asgMathAlgebra, studentEmma, clsGrade10A, subMath,
            now.AddDays(-9), SubmissionStatus.Graded, 98.00m,
            "Exceptional precision and complete mathematical proofs throughout all sections. Top score in class."));
        submissions.Add(CreateSubmission(asgCSOop, studentEmma, clsGrade10A, subCS,
            now.AddDays(-6), SubmissionStatus.Graded, 49.00m,
            "Flawless OOP principles demonstrated with clean SOLID patterns and test assertions."));
        submissions.Add(CreateSubmission(asgPhysMechanics, studentEmma, clsGrade10A, subPhys,
            now.AddDays(-8), SubmissionStatus.Graded, 93.50m,
            "Very clear diagrams and precise numerical integration. Excellent laboratory writeup."));
        submissions.Add(CreateSubmission(asgHistColdWar, studentEmma, clsGrade10A, subHist,
            now.AddDays(-3), SubmissionStatus.Graded, 97.00m,
            "Deep historical synthesis of the détente era with exceptional diplomatic analysis."));
        submissions.Add(CreateSubmission(asgMathCalculus, studentEmma, clsGrade10A, subMath,
            now.AddDays(-1), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins

        // --- Liam Chen Submissions ---
        submissions.Add(CreateSubmission(asgMathAlgebra, studentLiam, clsGrade10A, subMath,
            now.AddDays(-8), SubmissionStatus.Graded, 84.00m,
            "Solid understanding of factoring polynomials. Watch for negative sign propagation in problem 3b."));
        submissions.Add(CreateSubmission(asgCSOop, studentLiam, clsGrade10A, subCS,
            now.AddDays(-5), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins
        submissions.Add(CreateSubmission(asgPhysMechanics, studentLiam, clsGrade10A, subPhys,
            now.AddDays(-7), SubmissionStatus.Graded, 82.50m,
            "Good effort on planetary dynamics calculations. Make sure to label all vector axes."));
        submissions.Add(CreateSubmission(asgHistColdWar, studentLiam, clsGrade10A, subHist,
            now.AddDays(-3), SubmissionStatus.Graded, 89.00m,
            "Well written essay on post-war treaty structures and geopolitical balance of power."));
        submissions.Add(CreateSubmission(asgMathCalculus, studentLiam, clsGrade10A, subMath,
            now.AddDays(-1), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins

        // --- Sophia Martinez Submissions ---
        submissions.Add(CreateSubmission(asgMathAlgebra, studentSophia, clsGrade10A, subMath,
            now.AddDays(-9), SubmissionStatus.Graded, 91.00m,
            "Very clear steps and accurate graphing of quadratic parabolas."));
        submissions.Add(CreateSubmission(asgCSOop, studentSophia, clsGrade10A, subCS,
            now.AddDays(-6), SubmissionStatus.Graded, 45.50m,
            "Good use of inheritance and polymorphism. Added comments made the logic easy to follow."));
        submissions.Add(CreateSubmission(asgChemTitration, studentSophia, clsGrade10A, subChem,
            now.AddDays(-11), SubmissionStatus.Graded, 94.00m,
            "Precise lab measurements and accurate pH curves. Excellent buffer calculations."));
        submissions.Add(CreateSubmission(asgEngShakespeare, studentSophia, clsGrade10A, subEng,
            now.AddDays(-13), SubmissionStatus.Graded, 92.00m,
            "Strong arguments and great text citations from Acts 1 and 3."));
        submissions.Add(CreateSubmission(asgMathCalculus, studentSophia, clsGrade10A, subMath,
            now.AddDays(-1), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins

        // --- Noah Patel Submissions ---
        submissions.Add(CreateSubmission(asgMathAlgebra, studentNoah, clsGrade10A, subMath,
            now.AddDays(-8), SubmissionStatus.Graded, 78.50m,
            "Good conceptual grasp. Please review quadratic formula discriminant cases for complex roots."));
        submissions.Add(CreateSubmission(asgCSOop, studentNoah, clsGrade10A, subCS,
            now.AddDays(-5), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins
        submissions.Add(CreateSubmission(asgPhysMechanics, studentNoah, clsGrade10A, subPhys,
            now.AddDays(-7), SubmissionStatus.Graded, 80.00m,
            "Review vector component resolutions in multi-body gravitational systems."));
        submissions.Add(CreateSubmission(asgMathCalculus, studentNoah, clsGrade10A, subMath,
            now.AddDays(-1), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins

        // --- Other Cohort Submissions ---
        submissions.Add(CreateSubmission(asgCSDatabase, studentMaya, clsGrade11Sci, subCS,
            now.AddDays(-2), SubmissionStatus.Submitted)); // Pending grading for Sarah Jenkins
        submissions.Add(CreateSubmission(asgCSDatabase, studentEthan, clsGrade11Sci, subCS,
            now.AddDays(-2), SubmissionStatus.Graded, 92.00m,
            "Solid normalization and very thoughtful indexing strategy."));
        submissions.Add(CreateSubmission(asgEconMicro, studentAva, clsGrade11Com, subEcon,
            now.AddDays(-1), SubmissionStatus.Submitted)); // Pending grading for Clara Oswald

        db.Submissions.AddRange(submissions);
        await db.SaveChangesAsync();

        // ==========================================
        // 8. WRITE SAMPLE PDF ARTIFACTS TO STORAGE
        // ==========================================
        foreach (var (key, bytes) in samplePdfFiles)
        {
            try
            {
                var filePath = Path.Combine(contentRoot, "StorageUploads", key);
                var dir = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(dir))
                {
                    Directory.CreateDirectory(dir);
                }
                await File.WriteAllBytesAsync(filePath, bytes);
            }
            catch
            {
                // Continue if disk write is restricted
            }
        }
    }

    /// <summary>
    /// Generates a valid, lightweight PDF 1.4 binary file with exact byte-offset xref table for previewing.
    /// </summary>
    private static byte[] BuildValidPdf(string title, string studentName, string className, string subjectName, DateTime submittedAt)
    {
        var contentStream = $"BT /F1 18 Tf 50 720 Td ({EscapePdf(title)}) Tj ET\n" +
                            $"BT /F1 12 Tf 50 690 Td (Student: {EscapePdf(studentName)}) Tj ET\n" +
                            $"BT /F1 12 Tf 50 670 Td (Class: {EscapePdf(className)} | Subject: {EscapePdf(subjectName)}) Tj ET\n" +
                            $"BT /F1 10 Tf 50 645 Td (Submitted At: {submittedAt:yyyy-MM-dd HH:mm:ss} UTC) Tj ET\n" +
                            $"BT /F1 11 Tf 50 605 Td (--- Coursework Submission Solution Document ---) Tj ET\n" +
                            $"BT /F1 10 Tf 50 575 Td (1. Solution Derivation and Detailed Analytical Proof:) Tj ET\n" +
                            $"BT /F1 10 Tf 60 555 Td (All problem steps were completed in accordance with assignment instructions.) Tj ET\n" +
                            $"BT /F1 10 Tf 60 535 Td (Mathematical models, empirical data points, and code algorithms were verified.) Tj ET\n" +
                            $"BT /F1 10 Tf 60 515 Td (Final calculated results are highlighted with associated error margins.) Tj ET\n" +
                            $"BT /F1 10 Tf 50 475 Td (2. Academic Integrity & Verification:) Tj ET\n" +
                            $"BT /F1 10 Tf 60 455 Td (I confirm this assignment represents my own original coursework.) Tj ET\n" +
                            $"BT /F1 10 Tf 60 435 Td (Student Signature: {EscapePdf(studentName)}) Tj ET\n";

        var contentBytes = Encoding.UTF8.GetBytes(contentStream);

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms, Encoding.ASCII, leaveOpen: true);

        writer.Write("%PDF-1.4\n");
        writer.Flush();

        var offsets = new List<long>();

        // 1 0 obj - Catalog
        offsets.Add(ms.Position);
        writer.Write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        writer.Flush();

        // 2 0 obj - Pages
        offsets.Add(ms.Position);
        writer.Write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        writer.Flush();

        // 3 0 obj - Page
        offsets.Add(ms.Position);
        writer.Write("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n");
        writer.Flush();

        // 4 0 obj - Contents stream
        offsets.Add(ms.Position);
        writer.Write($"4 0 obj\n<< /Length {contentBytes.Length} >>\nstream\n");
        writer.Flush();
        ms.Write(contentBytes, 0, contentBytes.Length);
        writer.Write("\nendstream\nendobj\n");
        writer.Flush();

        // 5 0 obj - Font
        offsets.Add(ms.Position);
        writer.Write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
        writer.Flush();

        // xref table
        var startXref = ms.Position;
        writer.Write($"xref\n0 {offsets.Count + 1}\n");
        writer.Write("0000000000 65535 f \n");
        foreach (var offset in offsets)
        {
            writer.Write($"{offset:D10} 00000 n \n");
        }

        writer.Write($"trailer\n<< /Size {offsets.Count + 1} /Root 1 0 R >>\nstartxref\n{startXref}\n%%EOF\n");
        writer.Flush();

        return ms.ToArray();
    }

    private static string EscapePdf(string text)
    {
        return text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
    }
}

