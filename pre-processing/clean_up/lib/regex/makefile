# -----------//-----------
# This is a C++ makefile.|
# -----------//-----------



# whether or not to use precompiled headers (set to 'true' to use)
USE_PCH			:= false



# directories
SRC_DIR 		:= src
OBJ_DIR 		:= obj
BIN_DIR 		:= lib


INC_PATHS		:= include


# files
SRC_FILES 		:= $(shell find $(SRC_DIR) -name "*.cpp" -o \
                                           -name "*.cxx" -o \
										   -name "*.c++" -o \
										   -name "*.cc")
OBJ_FILES		:= $(patsubst $(SRC_DIR)/%,$(OBJ_DIR)/%.o,$(SRC_FILES))
INC_FILES 		:= $(shell find $(INC_PATH) -name "*.hpp" -o \
										    -name "*.hxx" -o \
										    -name "*.h++" -o \
										    -name "*.hh"  -o \
										    -name "*.h")
PCH_INC_FILES 	:=

BIN 			:= $(BIN_DIR)/libboost_regex.a



# language standard to be used
STD				:= c++20

# compiler flags
CXXFLAGS 		:= -Wall -Wextra -Wsign-conversion -pedantic -pedantic-errors -std=$(STD)
CXXFLAGS 		+= -DBOOST_REGEX_STANDALONE
CXXFLAGS        += $(foreach path,$(INC_PATHS),-I$(path))

# linker flags (e.g. -L/path/to/lib)
LDFLAGS			:=

# linker libraries (e.g. -lm)
LDLIBS			:=



# profiles
release: CXXFLAGS += -O2 -DNDEBUG
release: all

debug: CXXFLAGS += -O0 -g -fsanitize=address
debug: all



# make default goal (using make with no specified recipe)
.DEFAULT_GOAL := all

all: $(BIN)

build: clean $(.DEFAULT_GOAL)

$(BIN): $(PCH_INC_FILES) $(OBJ_FILES)
	@mkdir -p $(@D)
	$(AR) $@ $(filter %.o,$^)

# generate each object file according to the corresponding source file
# create directories as needed
# https://www.gnu.org/software/make/manual/make.html# Static-Pattern
$(OBJ_FILES): $(OBJ_DIR)/%.o : $(SRC_DIR)/%
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -c $< -o $@

$(PCH_INC_FILES): %.$(PCH_EXT) : %
	$(CXX) $(CXXFLAGS) -x c++-header $< -o $@


# 'clean' doesn't represent an actual file generating recipe
.PHONY: clean

clean:
	-rm -rf $(OBJ_DIR) $(BIN_DIR) $(PCH_INC_FILES)
